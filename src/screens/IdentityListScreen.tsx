import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useIdentities} from '../context/IdentityContext';
import {useTheme} from '../context/ThemeContext';
import {SwipeableCards} from '../components/SwipeableCards';
import {useScreenTracking} from '../hooks/usePerformance';
import {IdentityValidationService, IdentityValidation} from '../services/IdentityValidationService';
import {Identity} from '../types/Identity';

type IdentityListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Home'
>;

function IdentityListScreen() {
  const navigation = useNavigation<IdentityListScreenNavigationProp>();
  const {identities, loading, error, refreshIdentities, clearError} = useIdentities();
  const {theme, isDarkMode, toggleTheme} = useTheme();
  const [validations, setValidations] = useState<Map<string, IdentityValidation>>(new Map());

  // Track screen views for analytics
  useScreenTracking('IdentityList');

  // Validate identities when they change
  useEffect(() => {
    const validationService = IdentityValidationService.getInstance();
    const newValidations = new Map<string, IdentityValidation>();
    
    identities.forEach(identity => {
      const validation = validationService.validateIdentity(identity);
      newValidations.set(identity.id, validation);
    });
    
    setValidations(newValidations);
  }, [identities]);

  const handleSwipeRight = (identity: Identity) => {
    // Keep the identity (no action needed as it's already stored)
    console.log('Kept identity:', identity.name);
  };

  const handleSwipeLeft = (identity: Identity) => {
    // Skip for now - in future could implement archiving
    console.log('Skipped identity:', identity.name);
  };

  const handleCardPress = (identity: Identity) => {
    navigation.navigate('IdentityDetail', {identityId: identity.id});
  };

  const handleScanPress = () => {
    const bottomTabs = navigation.getParent();
    if (bottomTabs) {
      bottomTabs.navigate('Scan');
    }
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyState, {backgroundColor: theme.colors.background}]}>
      <View style={{marginBottom: 24}}>
        <Icon name={IconNames.emptyIdentity} size={80} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>No Identities Yet</Text>
      <Text style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
        Scan a QR code to add your first identity
      </Text>
      <TouchableOpacity
        style={[styles.scanButton, {backgroundColor: theme.colors.primary}]}
        onPress={handleScanPress}>
        <View style={styles.scanButtonContent}>
          <Icon name={IconNames.scan} size={24} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={[styles.errorState, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.errorTitle, {color: theme.colors.error}]}>Error Loading Identities</Text>
      <Text style={[styles.errorMessage, {color: theme.colors.textSecondary}]}>{error}</Text>
      <TouchableOpacity
        style={[styles.retryButton, {backgroundColor: theme.colors.primary}]}
        onPress={refreshIdentities}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && identities.length === 0) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, {color: theme.colors.textSecondary}]}>Loading identities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && identities.length === 0) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  if (identities.length === 0) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={[styles.header, {backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border}]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, {color: theme.colors.text}]}>Anon Identity</Text>
            <View style={styles.themeToggle}>
              <Icon
                name={isDarkMode ? IconNames.darkMode : IconNames.lightMode}
                size={20}
                color={theme.colors.textSecondary}
              />
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{false: theme.colors.border, true: theme.colors.primary}}
                thumbColor={theme.dark ? theme.colors.card : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
        {renderEmptyState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={[styles.header, {backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border}]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, {color: theme.colors.text}]}>Your Identities</Text>
            <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
              {identities.length} {identities.length === 1 ? 'identity' : 'identities'} stored
            </Text>
          </View>
          <View style={styles.themeToggle}>
            <Text style={[styles.themeLabel, {color: theme.colors.textSecondary}]}>Dark</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{false: theme.colors.border, true: theme.colors.primary}}
              thumbColor={theme.dark ? theme.colors.card : '#f4f3f4'}
            />
          </View>
        </View>
        {error && (
          <TouchableOpacity
            style={[styles.errorBanner, {backgroundColor: theme.colors.error + '20'}]}
            onPress={clearError}>
            <Text style={[styles.errorBannerText, {color: theme.colors.error}]}>{error}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.cardsContainer}>
        <SwipeableCards
          identities={identities}
          validations={validations}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onCardPress={handleCardPress}
          onEmptyAction={handleScanPress}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeLabel: {
    fontSize: 14,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorBannerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
  scanButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IdentityListScreen;
