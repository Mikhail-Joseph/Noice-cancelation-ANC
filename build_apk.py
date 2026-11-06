import os
import re
import subprocess
import shutil

BUILD_DIR = "/tmp/android_apk_build"
if os.path.exists(BUILD_DIR):
    shutil.rmtree(BUILD_DIR)

os.makedirs(f"{BUILD_DIR}/src/com/aerosilence/anc", exist_ok=True)
os.makedirs(f"{BUILD_DIR}/res/drawable", exist_ok=True)
os.makedirs(f"{BUILD_DIR}/res/values", exist_ok=True)
os.makedirs(f"{BUILD_DIR}/assets/www/assets", exist_ok=True)
os.makedirs(f"{BUILD_DIR}/bin", exist_ok=True)

print("[1/6] Building production web app dist...")
subprocess.run(["npm", "run", "build"], check=True)

# Process dist/index.html to inline CSS and convert JS to standard non-module script
print("[2/6] Inlining production bundle into single-file offline index.html...")
with open("dist/index.html", "r", encoding="utf-8") as f:
    html_content = f.read()

# Find CSS link
css_match = re.search(r'<link rel="stylesheet"[^>]*href="([^"]+)">', html_content)
if css_match:
    css_path = css_match.group(1).lstrip('./')
    full_css_path = os.path.join("dist", css_path)
    if os.path.exists(full_css_path):
        with open(full_css_path, "r", encoding="utf-8") as cf:
            css_data = cf.read()
        html_content = html_content.replace(css_match.group(0), f'<style>\n{css_data}\n</style>')

# Find JS script tag
js_match = re.search(r'<script[^>]*src="([^"]+)"[^>]*></script>', html_content)
if js_match:
    js_path = js_match.group(1).lstrip('./')
    full_js_path = os.path.join("dist", js_path)
    if os.path.exists(full_js_path):
        with open(full_js_path, "r", encoding="utf-8") as jf:
            js_data = jf.read()
        # Inline JavaScript directly so zero external file fetches are needed
        html_content = html_content.replace(js_match.group(0), f'<script>\n{js_data}\n</script>')

# Remove any remote service worker or registerSW references that might fail on file:///
html_content = re.sub(r'<script[^>]*register-sw[^>]*></script>', '', html_content)

# Write the self-contained inlined index.html
with open(f"{BUILD_DIR}/assets/www/index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

# Also copy all static assets to assets/www as companion
for item in os.listdir("dist"):
    s = os.path.join("dist", item)
    d = os.path.join(f"{BUILD_DIR}/assets/www", item)
    if os.path.isdir(s):
        if not os.path.exists(d):
            shutil.copytree(s, d)
    else:
        if not item.endswith(".apk") and not item.endswith(".idsig") and item != "index.html":
            shutil.copy2(s, d)

# Copy app icon
shutil.copy("public/pwa-192x192.png", f"{BUILD_DIR}/res/drawable/icon.png")

# strings.xml
with open(f"{BUILD_DIR}/res/values/strings.xml", "w", encoding="utf-8") as f:
    f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">AeroSilence ANC</string>
</resources>
''')

# AndroidManifest.xml (v1.3.0)
with open(f"{BUILD_DIR}/AndroidManifest.xml", "w", encoding="utf-8") as f:
    f.write('''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.aerosilence.anc"
    android:versionCode="4"
    android:versionName="1.3.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.INTERNET" />

    <uses-feature android:name="android.hardware.microphone" android:required="false" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/icon"
        android:hardwareAccelerated="true"
        android:allowBackup="true"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
''')

# MainActivity.java (Loads http://localhost/index.html with asset interception to ensure Secure Context for getUserMedia)
with open(f"{BUILD_DIR}/src/com/aerosilence/anc/MainActivity.java", "w", encoding="utf-8") as f:
    f.write('''package com.aerosilence.anc;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.webkit.ConsoleMessage;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.Window;
import android.view.WindowManager;
import java.io.InputStream;
import java.io.IOException;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                android.util.Log.d("AeroSilence", consoleMessage.message() + " [" + consoleMessage.lineNumber() + "]");
                return true;
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        request.grant(request.getResources());
                    }
                });
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri != null && "localhost".equalsIgnoreCase(uri.getHost())) {
                    return handleLocalRequest(uri.getPath());
                }
                return super.shouldInterceptRequest(view, request);
            }

            @SuppressWarnings("deprecation")
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                Uri uri = Uri.parse(url);
                if (uri != null && "localhost".equalsIgnoreCase(uri.getHost())) {
                    return handleLocalRequest(uri.getPath());
                }
                return super.shouldInterceptRequest(view, url);
            }
        });

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED ||
                checkSelfPermission(android.Manifest.permission.MODIFY_AUDIO_SETTINGS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{
                    android.Manifest.permission.RECORD_AUDIO,
                    android.Manifest.permission.MODIFY_AUDIO_SETTINGS
                }, 101);
            }
        }

        // Loading via http://localhost provides a W3C & Chromium Secure Context for navigator.mediaDevices.getUserMedia
        webView.loadUrl("http://localhost/index.html");
    }

    private WebResourceResponse handleLocalRequest(String path) {
        if (path == null || path.isEmpty() || path.equals("/")) {
            path = "/index.html";
        }
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        String assetPath = "www/" + path;
        try {
            InputStream stream = getAssets().open(assetPath);
            String mime = getMimeType(assetPath);
            return new WebResourceResponse(mime, "UTF-8", stream);
        } catch (IOException e) {
            try {
                InputStream fallback = getAssets().open("www/index.html");
                return new WebResourceResponse("text/html", "UTF-8", fallback);
            } catch (IOException ex) {
                return null;
            }
        }
    }

    private String getMimeType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".js")) return "application/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".wav")) return "audio/wav";
        return "application/octet-stream";
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 101 && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            if (webView != null) {
                webView.reload();
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
''')

ANDROID_JAR = "/usr/lib/android-sdk/platforms/android-23/android.jar"

print("[3/6] Generating R.java with aapt...")
subprocess.run([
    "aapt", "package", "-f", "-m",
    "-J", f"{BUILD_DIR}/src",
    "-M", f"{BUILD_DIR}/AndroidManifest.xml",
    "-S", f"{BUILD_DIR}/res",
    "-I", ANDROID_JAR
], check=True)

print("[4/6] Compiling Java source files with javac...")
java_files = [
    f"{BUILD_DIR}/src/com/aerosilence/anc/R.java",
    f"{BUILD_DIR}/src/com/aerosilence/anc/MainActivity.java"
]
subprocess.run([
    "javac", "-source", "8", "-target", "8",
    "-d", f"{BUILD_DIR}/bin",
    "-bootclasspath", ANDROID_JAR,
    "-cp", ANDROID_JAR
] + java_files, check=True)

print("[5/6] Converting bytecode to Dalvik with dx...")
subprocess.run([
    "java", "-jar", "/usr/share/java/com.android.dx.jar",
    "--dex",
    f"--output={BUILD_DIR}/bin/classes.dex",
    f"{BUILD_DIR}/bin"
], check=True)

print("[6/6] Packaging APK with embedded offline assets...")
unaligned_apk = f"{BUILD_DIR}/bin/unaligned.apk"
subprocess.run([
    "aapt", "package", "-f",
    "-M", f"{BUILD_DIR}/AndroidManifest.xml",
    "-S", f"{BUILD_DIR}/res",
    "-A", f"{BUILD_DIR}/assets",
    "-I", ANDROID_JAR,
    "-F", unaligned_apk
], check=True)

# Add classes.dex into unaligned apk
os.chdir(f"{BUILD_DIR}/bin")
subprocess.run(["aapt", "add", unaligned_apk, "classes.dex"], check=True)
os.chdir("/app/applet")

# Generate release keystore if not exists
KEYSTORE = f"{BUILD_DIR}/release.keystore"
subprocess.run([
    "keytool", "-genkeypair", "-v",
    "-keystore", KEYSTORE,
    "-storepass", "aerosilence2026",
    "-keypass", "aerosilence2026",
    "-alias", "aerosilence",
    "-keyalg", "RSA",
    "-keysize", "2048",
    "-validity", "10000",
    "-dname", "CN=AeroSilence, OU=Audio, O=AeroSilence, L=Global, ST=Audio, C=US"
], check=True)

aligned_apk = f"{BUILD_DIR}/bin/aligned.apk"
print("Aligning and signing APK...")
subprocess.run([
    "zipalign", "-f", "4",
    unaligned_apk,
    aligned_apk
], check=True)

FINAL_APK = "public/AeroSilence-ANC.apk"
subprocess.run([
    "apksigner", "sign",
    "--ks", KEYSTORE,
    "--ks-pass", "pass:aerosilence2026",
    "--ks-key-alias", "aerosilence",
    "--key-pass", "pass:aerosilence2026",
    "--out", FINAL_APK,
    aligned_apk
], check=True)

print(f"SUCCESS! Offline APK built and signed at {FINAL_APK}")
stat = os.stat(FINAL_APK)
print(f"APK File Size: {stat.st_size} bytes ({stat.st_size / 1024:.1f} KB)")
