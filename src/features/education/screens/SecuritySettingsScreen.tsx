import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  View,
  StyleSheet,
  Text,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import {
  getSecuritySettings,
  resetSecuritySettings,
  saveSecuritySettings,
} from '../../../utils/securitySettingsStorage';
import { ThemeContext } from '../../../store/ThemeContext';
import { AuthContext } from '../../../store/AuthContext';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const SecuritySettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const themeContext = useContext(ThemeContext);
  const authContext = useContext(AuthContext);
  const [twoFA, setTwoFA] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(
    null,
  );
  const [biometricType, setBiometricType] = useState<BiometryTypes | undefined>(
    undefined,
  );
  const isThemeDark = themeContext?.theme === 'dark';
  const rnBiometrics = useMemo(() => new ReactNativeBiometrics(), []);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      const settings = await getSecuritySettings();
      if (!isMounted) return;
      setTwoFA(authContext?.user?.twoFactorEnabled ?? settings.twoFA);
      setDarkMode(settings.darkMode);
      setBiometric(settings.biometric);
      setIsLoaded(true);
      if (themeContext) {
        const desiredTheme = settings.darkMode ? 'dark' : 'light';
        if (themeContext.theme !== desiredTheme) {
          themeContext.setTheme(desiredTheme);
        }
      }
    };
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [authContext?.user?.twoFactorEnabled, themeContext]);

  useEffect(() => {
    if (!isLoaded) return;
    saveSecuritySettings({ twoFA, darkMode, biometric });
  }, [twoFA, darkMode, biometric, isLoaded]);

  useEffect(() => {
    let isMounted = true;
    const checkBiometrics = async () => {
      try {
        const { available, biometryType } =
          await rnBiometrics.isSensorAvailable();
        if (!isMounted) return;
        setBiometricSupported(available);
        setBiometricType(biometryType);
        if (!available && biometric) {
          setBiometric(false);
        }
      } catch {
        if (!isMounted) return;
        setBiometricSupported(false);
        setBiometricType(undefined);
        if (biometric) {
          setBiometric(false);
        }
      }
    };
    checkBiometrics();
    return () => {
      isMounted = false;
    };
  }, [rnBiometrics, biometric]);

  useEffect(() => {
    if (!isLoaded || !themeContext) return;
    const desiredTheme = darkMode ? 'dark' : 'light';
    if (themeContext.theme !== desiredTheme) {
      themeContext.setTheme(desiredTheme);
    }
  }, [darkMode, isLoaded, themeContext]);

  useEffect(() => {
    if (!isLoaded || !themeContext) return;
    if (themeContext.theme === 'auto') return;
    if (darkMode !== isThemeDark) {
      setDarkMode(isThemeDark);
    }
  }, [isThemeDark, darkMode, isLoaded, themeContext]);

  const handleToggleBiometric = async (nextValue: boolean) => {
    if (!nextValue) {
      setBiometric(false);
      return;
    }

    if (!biometricSupported) {
      Alert.alert(
        'Thiết bị không hỗ trợ',
        'Thiết bị của bạn không hỗ trợ sinh trắc học.',
      );
      setBiometric(false);
      return;
    }

    try {
      const result = await rnBiometrics.simplePrompt({
        promptMessage: 'Xác thực sinh trắc học',
      });
      setBiometric(Boolean(result.success));
      if (!result.success) {
        Alert.alert('Xác thực thất bại', 'Vui lòng thử lại.');
      }
    } catch {
      setBiometric(false);
      Alert.alert('Xác thực thất bại', 'Vui lòng thử lại.');
    }
  };

  const handleToggleTwoFA = (nextValue: boolean) => {
    navigation.navigate('TwoFA', {
      action: nextValue ? 'enable' : 'disable',
    });
  };

  const handleReset = () => {
    Alert.alert('Đặt lại bảo mật', 'Bạn muốn reset các thiết lập bảo mật?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          const defaults = await resetSecuritySettings();
          setTwoFA(defaults.twoFA);
          setDarkMode(defaults.darkMode);
          setBiometric(defaults.biometric);
          if (themeContext) {
            themeContext.setTheme('light');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cài đặt bảo mật</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Bật 2FA</Text>
          <Switch value={twoFA} onValueChange={handleToggleTwoFA} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Biometric</Text>
          <Switch value={biometric} onValueChange={handleToggleBiometric} />
        </View>
        <Text style={styles.helperText}>
          {biometricSupported === false
            ? 'Thiết bị chưa hỗ trợ sinh trắc học.'
            : biometricType === BiometryTypes.FaceID
            ? 'Sử dụng Face ID để xác thực.'
            : biometricType === BiometryTypes.TouchID
            ? 'Sử dụng Touch ID để xác thực.'
            : biometricType === BiometryTypes.Biometrics
            ? 'Sử dụng vân tay/Face để xác thực.'
            : 'Kiểm tra sinh trắc học trên thiết bị.'}
        </Text>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetText}>Reset bảo mật</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.note}>
        * Dark Mode đã đồng bộ với giao diện toàn app.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  note: {
    marginTop: Spacing.md,
    fontSize: 12,
    color: Colors.textMuted,
  },
  helperText: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textMuted,
  },
  resetButton: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default SecuritySettingsScreen;
