#!/usr/bin/env bash
set -e
mkdir -p android/app/src/main/java/com/rahayacoffee/pos
cat > android/app/src/main/java/com/rahayacoffee/pos/MainActivity.java <<'JAVA'
package com.rahayacoffee.pos;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.bluetoothserial.plugin.BluetoothSerialPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BluetoothSerialPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
JAVA
