package dev.venturis.clippy;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Durable outbox and receipt ledger. Storage must commit atomically or throw. */
final class SyncJournal {
    interface Storage { byte[] read() throws Exception; void write(byte[] bytes) throws Exception; }
    private final Storage storage;
    private LinkedHashMap<String,String> outgoing = new LinkedHashMap<>();
    private LinkedHashMap<String,Long> received = new LinkedHashMap<>();
    private HashSet<String> acknowledged = new HashSet<>();
    private long cursor;
    private String lastHash="";
    SyncJournal(Storage storage) throws Exception {
        this.storage=storage;byte[] bytes=storage.read();if(bytes!=null)decode(bytes);
    }
    synchronized Map<String,String> outgoing(){return new LinkedHashMap<>(outgoing);}
    synchronized boolean hasReceived(String id){return received.containsKey(id);}
    synchronized long cursor(){return cursor;}
    synchronized String enqueue(String text) throws Exception {
        if(text==null||text.isEmpty()||text.length()>65536)throw new IOException("Clipboard text exceeds the supported size.");
        String hash=SyncPolicy.hash(text);if(hash.equals(lastHash))return null;
        if(outgoing.size()>=64)throw new IOException("Outgoing clipboard queue is full. Retry sync before copying more text.");
        String id=UUID.randomUUID().toString();change(()->{outgoing.put(id,text);lastHash=hash;});return id;
    }
    synchronized void sent(String id) throws Exception {change(()->outgoing.remove(id));}
    synchronized void received(String id,long revision) throws Exception {change(()->received.put(id,revision));}
    synchronized void received(String id,long revision,String text) throws Exception {change(()->{received.put(id,revision);lastHash=SyncPolicy.hash(text);});}
    synchronized void acknowledged(String id,long revision) throws Exception {
        change(()->{acknowledged.add(id);cursor=Math.max(cursor,revision);
            Iterator<String> ids=received.keySet().iterator();while(received.size()>2048&&ids.hasNext()){String old=ids.next();if(acknowledged.remove(old))ids.remove();}
        });
    }
    private void change(Runnable change) throws Exception {
        byte[] before=encode();
        try {change.run();storage.write(encode());}
        catch(Exception error){decode(before);throw error;}
    }
    private byte[] encode() throws IOException {
        if(received.size()>8192)throw new IOException("Receipt queue is full. Restore the connection to acknowledge pending items.");
        ByteArrayOutputStream bytes=new ByteArrayOutputStream();DataOutputStream out=new DataOutputStream(bytes);
        out.writeInt(0x434c5032);out.writeLong(cursor);out.writeUTF(lastHash);out.writeInt(outgoing.size());
        for(Map.Entry<String,String> e:outgoing.entrySet()){out.writeUTF(e.getKey());byte[] value=e.getValue().getBytes(StandardCharsets.UTF_8);out.writeInt(value.length);out.write(value);}
        out.writeInt(received.size());for(Map.Entry<String,Long> e:received.entrySet()){out.writeUTF(e.getKey());out.writeLong(e.getValue());out.writeBoolean(acknowledged.contains(e.getKey()));}
        out.flush();return bytes.toByteArray();
    }
    private void decode(byte[] bytes) throws IOException {
        DataInputStream in=new DataInputStream(new ByteArrayInputStream(bytes));
        int version=in.readInt();if(version!=0x434c5031&&version!=0x434c5032)throw new IOException("Saved sync state is corrupt; pending data was not reset.");
        cursor=in.readLong();lastHash=version==0x434c5032?in.readUTF():"";outgoing=new LinkedHashMap<>();received=new LinkedHashMap<>();acknowledged=new HashSet<>();
        int count=count(in,64);for(int i=0;i<count;i++){String id=in.readUTF();int length=count(in,262144);byte[] value=new byte[length];in.readFully(value);outgoing.put(id,new String(value,StandardCharsets.UTF_8));}
        count=count(in,8192);for(int i=0;i<count;i++){String id=in.readUTF();received.put(id,in.readLong());if(in.readBoolean())acknowledged.add(id);}
        if(in.available()!=0)throw new IOException("Unsupported saved sync state.");
    }
    private int count(DataInputStream in,int max) throws IOException {int value=in.readInt();if(value<0||value>max)throw new IOException("Invalid saved sync state.");return value;}
}
