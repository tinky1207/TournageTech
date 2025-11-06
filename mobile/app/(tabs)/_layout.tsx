// app/(tabs)/_layout.tsx (updated)
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'expo-status-bar'; // Added import

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>{/* */}
      <StatusBar style="dark" />{/* */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#090b47',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#F9F9F9',
            borderTopWidth: 1,
            paddingTop: 4,
            elevation: 5,
            height: 90,
          },
        }}
      >{/* */}
        <Tabs.Screen 
          name="society" 
          options={{ 
            title: 'Society',
            tabBarIcon: ({ color, size }) => (
               <Ionicons name="chatbubble" size={size} color={color} />
            )
          }} 
        />{/* */}
        <Tabs.Screen 
          name="exercise" 
          options={{ 
            title: 'Exercise',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" size={size} color={color} />
            )
          }} 
        />{/* */}
        <Tabs.Screen 
          name="Study" 
          options={{ 
            title: 'Study',
            tabBarIcon: ({ color, size }) => (
               <Ionicons name="book" size={size} color={color} />
            )
          }} 
        />
      </Tabs>
    </SafeAreaView>
  );
}