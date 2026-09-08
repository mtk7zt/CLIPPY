package dev.venturis.clippy;

import android.content.Context;
import android.util.AtomicFile;
import java.io.*;

/** App-private, Keystore-encrypted and atomically committed; never backed up. */
final class EncryptedSyncStorage implements SyncJournal.Storage {
    private final AtomicFile file;
    EncryptedSyncStorage(Context context){file=new AtomicFile(new File(context.getNoBackupFilesDir(),"clipboard-journal"));}
    public byte[] read() throws Exception {
        try{return DeviceConfig.decrypt(file.readFully());}catch(FileNotFoundException missing){return null;}
    }
    public void write(byte[] bytes) throws Exception {
        byte[] encrypted=DeviceConfig.encrypt(bytes);FileOutputStream out=null;
        try{out=file.startWrite();out.write(encrypted);file.finishWrite(out);}catch(Exception error){if(out!=null)file.failWrite(out);throw error;}
    }
    void clear(){file.delete();}
}
