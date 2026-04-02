import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainTabs';
import { colors } from '../theme';

export function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
