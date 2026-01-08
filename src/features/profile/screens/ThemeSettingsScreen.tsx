import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ThemeContext, Theme } from '../../../store/ThemeContext';

type RootStackParamList = {
  Profile: undefined;
  ThemeSettings: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ThemeSettings'>;

const ThemeSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const { theme, setTheme } = themeContext;

  const handleThemeChange = async (newTheme: Theme) => {
    await setTheme(newTheme);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Giao diện</Text>
      </View>

      {/* Theme Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chọn chế độ giao diện</Text>

        {/* Light Mode */}
        <TouchableOpacity
          style={[
            styles.themeOption,
            theme === 'light' && styles.themeOptionSelected,
          ]}
          onPress={() => handleThemeChange('light')}
        >
          <View style={styles.themePreview}>
            <View style={styles.lightPreview} />
          </View>
          <View style={styles.themeInfo}>
            <Text style={styles.themeName}>Sáng</Text>
            <Text style={styles.themeDescription}>Giao diện sáng</Text>
          </View>
          {theme === 'light' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Dark Mode */}
        <TouchableOpacity
          style={[
            styles.themeOption,
            theme === 'dark' && styles.themeOptionSelected,
          ]}
          onPress={() => handleThemeChange('dark')}
        >
          <View style={styles.themePreview}>
            <View style={styles.darkPreview} />
          </View>
          <View style={styles.themeInfo}>
            <Text style={styles.themeName}>Tối</Text>
            <Text style={styles.themeDescription}>Giao diện tối</Text>
          </View>
          {theme === 'dark' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Auto Mode */}
        <TouchableOpacity
          style={[
            styles.themeOption,
            theme === 'auto' && styles.themeOptionSelected,
          ]}
          onPress={() => handleThemeChange('auto')}
        >
          <View style={styles.themePreview}>
            <View style={styles.autoPreview} />
          </View>
          <View style={styles.themeInfo}>
            <Text style={styles.themeName}>Tự động</Text>
            <Text style={styles.themeDescription}>Theo cài đặt hệ thống</Text>
          </View>
          {theme === 'auto' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          💡 Giao diện tối giúp giảm mỏi mắt khi sử dụng trong môi trường tối
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#EEE',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  themeOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  themePreview: {
    marginRight: 12,
  },
  lightPreview: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#DDD',
  },
  darkPreview: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#666',
  },
  autoPreview: {
    width: 50,
    height: 50,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#999',
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 13,
    color: '#999',
  },
  checkmark: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: '700',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
});

export default ThemeSettingsScreen;
