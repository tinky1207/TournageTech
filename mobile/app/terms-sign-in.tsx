// app/terms.tsx
import { ScrollView, Text, StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import * as React from 'react';

export default function TermsScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/sign-in')}>
        <Image source={require('../assets/images/left-arrow.png')} style={styles.backIcon} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text>Last Updated: October 04, 2025</Text>
        <Text>1. Acceptance of Terms</Text>
        <Text>By accessing or using the Tournage mobile application ("the App"), developed by Tournage Inc. ("we," "us," "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.</Text>
        <Text>2. Description of Service</Text>
        <Text>Tournage is a mobile application that connects tennis players to find matches, schedule games, and build a community around the sport. The service includes user profiles, match scheduling, in-app messaging, and location-based features.</Text>
        <Text>3. User Accounts and Eligibility</Text>
        <Text>• You must be at least 13 years old (or the minimum age in your jurisdiction) to use the App.</Text>
        <Text>• You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</Text>
        <Text>• You agree to provide accurate, current, and complete information during registration and to update it as necessary.</Text>
        <Text>4. User Conduct</Text>
        <Text>You agree not to:</Text>
        <Text>• Use the App for any illegal or unauthorized purpose.</Text>
        <Text>• Harass, abuse, intimidate, or harm other users.</Text>
        <Text>• Upload or share content that is defamatory, obscene, hateful, or violent.</Text>
        <Text>• Impersonate any person or entity.</Text>
        <Text>• Use the App to send unsolicited commercial communications ("spam").</Text>
        <Text>• Interfere with or disrupt the App's servers or networks.</Text>
        <Text>5. User-Generated Content</Text>
        <Text>• You retain all rights to the content you create and share on Tournage (e.g., profiles, messages, photos).</Text>
        <Text>• By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, host, store, reproduce, modify, and display that content solely for the purpose of operating, developing, and improving the App.</Text>
        <Text>6. Intellectual Property</Text>
        <Text>All rights, title, and interest in and to the App (excluding user-generated content) are and will remain our exclusive property. The App is protected by copyright, trademark, and other laws.</Text>
        <Text>7. Termination</Text>
        <Text>We may suspend or terminate your account and access to the App at our sole discretion, without notice, for conduct we believe violates these Terms or is harmful to other users, us, or third parties.</Text>
        <Text>8. Disclaimer of Warranties</Text>
        <Text>The App is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all warranties of any kind, whether express or implied, including but not limited to merchantability, fitness for a particular purpose, and non-infringement.</Text>
        <Text>9. Limitation of Liability</Text>
        <Text>To the fullest extent permitted by law, Tournage Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising from your use of the App.</Text>
        <Text>10. Governing Law</Text>
        <Text>These Terms shall be governed by and construed in accordance with the laws of California, USA, without regard to its conflict of law provisions.</Text>
        <Text>11. Changes to Terms</Text>
        <Text>We reserve the right to modify these Terms at any time. We will provide notice of changes by updating the "Last Updated" date. Your continued use of the App after any change constitutes your acceptance of the new Terms.</Text>
        <Text>12. Contact Us</Text>
        <Text>If you have any questions about these Terms, please contact us at: support@tournage.com or 123 Tennis St, Sports City, CA 12345.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  scrollContent: { paddingTop: 60 }, // Space for back button
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    marginTop: 10,
  },
  backIcon: {
    width: 40,
    height: 30,
  },
});