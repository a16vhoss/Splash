import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WashProfileScreen } from '../screens/WashProfileScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { ConfirmationScreen } from '../screens/ConfirmationScreen';
import { RatingScreen } from '../screens/RatingScreen';
import { colors, typography } from '../theme';

export type MainStackParamList = {
  HomeTabs: undefined;
  WashProfile: { carWashId: string };
  Schedule: { carWashId: string; serviceId: string; serviceName: string; precio: number; duracionMin: number };
  Confirmation: { appointmentId: string };
  Rating: { appointmentId: string; carWashName: string; serviceName: string; fecha: string };
};

type TabParamList = {
  Inicio: undefined;
  Citas: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.semiBold,
          fontSize: 11,
        },
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen as any}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Citas"
        component={AppointmentsScreen as any}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen name="WashProfile" component={WashProfileScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
    </Stack.Navigator>
  );
}
