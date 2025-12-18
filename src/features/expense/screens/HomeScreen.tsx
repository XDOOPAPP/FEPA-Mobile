import React from 'react';
import { View, Text, Button } from 'react-native';

export const HomeScreen = ({ navigation }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Màn hình chính</Text>
    <Button title="Đến trang Chi tiết" onPress={() => navigation.navigate('Details')} />
  </View>
);