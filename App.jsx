import React, { useState } from 'react';

export default function App() {
  const [device, setDevice] = useState(null);
  const [status, setStatus] = useState('غير متصل');
  const [battery, setBattery] = useState(null);

  // دالة البحث والاتصال بسماعات وأجهزة البلوتوث
  const connectBluetooth = async () => {
    try {
      setStatus('جاري البحث عن أجهزة البلوتوث...');
      
      // طلب الاتصال بأي جهاز بلوتوث قريب (يقبل أي خدمات صوتية أو عامة)
      const selectedDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'generic_access']
      });

      setDevice(selectedDevice);
      setStatus(`متصل مع: ${selectedDevice.name || 'جهاز بلوتوث'}`);

      // الاستماع لقطع الاتصال
      selectedDevice.addEventListener('gattserverdisconnected', () => {
        setStatus('تم انقطاع الاتصال');
        setDevice(null);
        setBattery(null);
      });

      // محاولة قراءة نسبة بطارية السماعة إن توفرت الخدمة
      const server = await selectedDevice.gatt.connect();
      try {
        const batteryService = await server.getPrimaryService('battery_service');
        const batteryCharacteristic = await batteryService.getCharacteristic('battery_level');
        const value = await batteryCharacteristic.readValue();
        setBattery(value.getUint8(0));
      } catch (e) {
        console.log('خدمة البطارية غير مدعومة في هذا الجهاز');
      }

    } catch (error) {
      console.error(error);
      setStatus('فشل الاتصال أو تم إلغاء العملية');
    }
  };

  // دالة قطع الاتصال
  const disconnectBluetooth = () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
    }
    setStatus('غير متصل');
    setDevice(null);
    setBattery(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', textAlign: 'center', backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      <h2>متحكم سماعات البلوتوث</h2>
      <p style={{ color: '#aaa' }}>حالة الاتصال: <span style={{ color: device ? '#4CAF50' : '#FF5252' }}>{status}</span></p>

      {battery !== null && (
        <div style={{ margin: '20px 0', fontSize: '18px', background: '#1e1e1e', padding: '10px', borderRadius: '8px' }}>
          🔋 مستوى بطارية السماعة: <strong>{battery}%</strong>
        </div>
      )}

      {!device ? (
        <button 
          onClick={connectBluetooth}
          style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '15px 30px', fontSize: '16px', borderRadius: '8px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' }}>
          بحث والاتصال بسماعة بلوتوث 🎧
        </button>
      ) : (
        <button 
          onClick={disconnectBluetooth}
          style={{ backgroundColor: '#FF5252', color: 'white', border: 'none', padding: '15px 30px', fontSize: '16px', borderRadius: '8px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' }}>
          قطع الاتصال ❌
        </button>
      )}
    </div>
  );
}
