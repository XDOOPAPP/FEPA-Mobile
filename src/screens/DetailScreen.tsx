import React from 'react';
import { View, Text, Button } from 'react-native';

export const DetailScreen = ({ navigation }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Trang Chi tiết</Text>
    <Button title="Quay lại" onPress={() => navigation.goBack()} />
  </View>
);