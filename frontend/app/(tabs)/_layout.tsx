import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AppointmentsScreen"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ChatScreen"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'chatbubble' : 'chatbubble-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );

  // return (
  //   <Tabs
  //     screenOptions={{
  //       tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
  //       headerShown: false,
  //     }}>
  //     <Tabs.Screen
  //       name="index"
  //       options={{
  //         title: 'Home',
  //         tabBarIcon: ({ color, focused }) => (
  //           <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
  //         ),
  //       }}
  //     />
  //     <Tabs.Screen
  //       name="explore"
  //       options={{
  //         title: 'Explore',
  //         tabBarIcon: ({ color, focused }) => (
  //           <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
  //         ),
  //       }}
  //     />
  //     <Tabs.Screen name="loginScreen" options={{ title: 'Вход' }} /> {/* component={LoginScreen} */}
  //     <Tabs.Screen name="registerScreen" options={{ title: 'Регистрация' }} /> {/* component={RegisterScreen} */}
  //     <Tabs.Screen name="forgotPasswordScreen" options={{ title: 'forgPass' }} />
  //     <Tabs.Screen name="resetPasswordScreen" options={{ title: 'resPass' }} />
  //     <Tabs.Screen name="verifyEmailScreen" options={{ title: 'verEmail' }} />
  //   </Tabs>
  // );
}


// // App.js
// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import LoginScreen from './loginScreen';
// import RegisterScreen from './registerScreen';
// import ForgotPasswordScreen from './forgotPasswordScreen';
// import VerifyEmailScreen from './verifyEmailScreen';
// import ResetPasswordScreen from './resetPasswordScreen';

// const Stack = createNativeStackNavigator();

// export default function App() {
//   return (
//       <Stack.Navigator initialRouteName="Login">
//         <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
//         <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
//         <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
//         <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: 'Verify Email' }} />
//         <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
//       </Stack.Navigator>
//   );
// }
