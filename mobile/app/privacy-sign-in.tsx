// app/privacy.tsx
import { ScrollView, Text, StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import * as React from 'react';

export default function PrivacyScreen() {
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
        <Text style={styles.title}>Privacy Policy</Text>
        <Text>Last Updated: October 04, 2025</Text>
        <Text>1. Introduction</Text>
        <Text>Tournage Inc. ("we," "us," "our") operates the Tournage mobile application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App.</Text>
        <Text>2. Information We Collect</Text>
        <Text>• Information You Provide:</Text>
        <Text>◦ Account Information: Name, email address, username, password, date of birth, tennis skill level, profile picture.</Text>
        <Text>◦ Profile Details: Your location (city/region), playing preferences, biography.</Text>
        <Text>◦ Communications: Messages you send to other users through the App.</Text>
        <Text>• Information Collected Automatically:</Text>
        <Text>◦ Usage Data: How you interact with the App (features used, time spent, pages visited).</Text>
        <Text>◦ Device Information: IP address, device type, operating system, unique device identifiers, mobile network information.</Text>
        <Text>◦ Location Information: With your permission, we collect precise or approximate location data from your mobile device to show you nearby players and courts.</Text>
        <Text>• Information from Third Parties: We use Clerk for authentication. When you register, we receive the information you provide to them (e.g., name, email) as governed by their privacy policy.</Text>
        <Text>3. How We Use Your Information</Text>
        <Text>We use the information we collect to:</Text>
        <Text>• Create, maintain, and secure your account.</Text>
        <Text>• Provide, operate, and improve the App's core features (matching, scheduling, messaging).</Text>
        <Text>• Personalize your experience and content.</Text>
        <Text>• Communicate with you about updates, security alerts, and support messages.</Text>
        <Text>• Analyze trends and usage to improve the App.</Text>
        <Text>• Ensure the safety and security of our users and the App.</Text>
        <Text>4. How We Share Your Information</Text>
        <Text>• With Other Users: Your profile information (username, skill level, general location, profile picture) is visible to other users of the App to facilitate matches.</Text>
        <Text>• Service Providers: We share data with trusted third-party vendors who perform services for us (e.g., cloud hosting, data analysis, customer support, authentication via Clerk). These parties are obligated to keep your information confidential.</Text>
        <Text>• Legal Requirements: We may disclose information if required to do so by law or in response to valid requests by public authorities.</Text>
        <Text>• Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred.</Text>
        <Text>5. Data Retention</Text>
        <Text>We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy, or as needed to comply with our legal obligations.</Text>
        <Text>6. Your Rights and Choices</Text>
        <Text>• Account Information: You can review and change your account information through the App's settings.</Text>
        <Text>• Location Access: You can enable or disable location services via your device settings.</Text>
        <Text>• Push Notifications: You can opt-out of push notifications via your device settings.</Text>
        <Text>• Account Deletion: You may request to delete your account by contacting us at support@tournage.com. This will remove your personal data from our active databases.</Text>
        <Text>7. Security</Text>
        <Text>We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee its absolute security.</Text>
        <Text>8. Children's Privacy</Text>
        <Text>The App is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it immediately.</Text>
        <Text>9. Third-Party Services</Text>
        <Text>Our App uses Clerk for user authentication. Their collection and use of your information are governed by their own privacy policy. We encourage you to review the Clerk Privacy Policy.</Text>
        <Text>10. Changes to This Privacy Policy</Text>
        <Text>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</Text>
        <Text>11. Contact Us</Text>
        <Text>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:</Text>
        <Text>Tournage Inc.</Text>
        <Text>123 Tennis St, Sports City, CA 12345</Text>
        <Text>support@tournage.com</Text>
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