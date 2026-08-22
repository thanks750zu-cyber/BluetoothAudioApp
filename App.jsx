import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  StatusBar
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

export default function App() {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isANCActive, setIsANCActive] = useState(false);
  const [isVoiceIsolationActive, setIsVoiceIsolationActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const apiLevel = parseInt(Platform.Version.toString(), 10);
      if (apiLevel >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  };

  const startScanning = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('تنبيه الأذونات', 'يرجى منح أذونات البلوتوث والموقع للبحث عن السماعات.');
      return;
    }

    setDevices([]);
    setIsScanning(true);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setIsScanning(false);
        return;
      }
      if (device && device.name) {
        setDevices((prevDevices) => {
          if (!prevDevices.some((d) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device) => {
    manager.stopDeviceScan();
    setIsScanning(false);
    try {
      const connected = await manager.connectToDevice(device.id);
      setConnectedDevice(connected);
      Alert.alert('تم الاتصال بنجاح', `متصل الآن مع: ${device.name || 'سماعة بلوتوث'}`);
    } catch (error) {
      console.error(error);
      Alert.alert('فشل الاتصال', 'تعذر الاتصال بالسماعة، حاول مرة أخرى.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* رأس التطبيق */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎧 Audio Controller</Text>
        <Text style={styles.headerSubtitle}>التحكم الذكي بالسماعات وعزل الضوضاء</Text>
      </View>

      {/* بطاقة الحالة والاتصال */}
      <View style={styles.statusCard}>
        <Text style={styles.cardLabel}>حالة السماعة</Text>
        <Text style={styles.connectedName}>
          {connectedDevice ? (connectedDevice.name || 'سماعة متصلة') : 'لا توجد سماعة متصلة'}
        </Text>
        
        <TouchableOpacity 
          style={[styles.scanButton, isScanning && styles.scanningActive]} 
          onPress={startScanning}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? 'جاري البحث عن السماعات...' : 'بحث عن سماعات بلوتوث'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* لوحة التحكم بالميزات المتقدمة (تظهر فقط عند الاتصال أو كميزات تجريبية) */}
      <View style={styles.controlsContainer}>
        <Text style={styles.sectionTitle}>ميزات عزل الصوت</Text>
        
        <View style={styles.controlRow}>
          <View>
            <Text style={styles.controlTitle}>إلغاء الضوضاء (ANC)</Text>
            <Text style={styles.controlDesc}>تقليص أصوات المحيط الخارجي</Text>
          </View>
          <TouchableOpacity 
            style={[styles.toggleBtn, isANCActive ? styles.btnActive : styles.btnInactive]}
            onPress={() => setIsANCActive(!isANCActive)}
          >
            <Text style={styles.toggleBtnText}>{isANCActive ? 'مفعل' : 'معطل'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlRow}>
          <View>
            <Text style={styles.controlTitle}>عزل صوت المكالمات</Text>
            <Text style={styles.controlDesc}>تصفية صوتك بوضوح للطرف الآخر</Text>
          </View>
          <TouchableOpacity 
            style={[styles.toggleBtn, isVoiceIsolationActive ? styles.btnActive : styles.btnInactive]}
            onPress={() => setIsVoiceIsolationActive(!isVoiceIsolationActive)}
          >
            <Text style={styles.toggleBtnText}>{isVoiceIsolationActive ? 'مفعل' : 'معطل'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* قائمة السماعات المتاحة */}
      <Text style={styles.sectionTitle}>الأجهزة القريبة المتاحة</Text>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deviceItem} onPress={() => connectToDevice(item)}>
            <View>
              <Text style={styles.deviceName}>{item.name || 'جهاز غير معروف'}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </View>
            <Text style={styles.connectText}>اتصال</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { marginBottom: 20, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  
  statusCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  cardLabel: { fontSize: 12, color: '#aaa', textTransform: 'uppercase', marginBottom: 6 },
  connectedName: { fontSize: 18, fontWeight: 'bold', color: '#00e676', marginBottom: 15 },
  
  scanButton: {
    backgroundColor: '#6200ee',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  scanningActive: { backgroundColor: '#3700b3' },
  scanButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  controlsContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  controlRow: {
    flexDirection: 'row',
    justifyN: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2c',
  },
  controlTitle: { fontSize: 14, fontWeight: 'bold', color: '#e0e0e0' },
  controlDesc: { fontSize: 11, color: '#888', marginTop: 2 },
  
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  btnActive: { backgroundColor: '#00e676' },
  btnInactive: { backgroundColor: '#333' },
  toggleBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  listContainer: { paddingBottom: 20 },
  deviceItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  deviceName: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  deviceId: { fontSize: 11, color: '#777', marginTop: 2 },
  connectText: { color: '#bb86fc', fontWeight: 'bold', fontSize: 14 },
});
