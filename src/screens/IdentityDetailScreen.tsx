import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useIdentities} from '../context/IdentityContext';
import {useScreenTracking} from '../hooks/usePerformance';
import {IdentityValidationService} from '../services/IdentityValidationService';

type IdentityDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'IdentityDetail'
>;

type IdentityDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'IdentityDetail'
>;

function IdentityDetailScreen() {
  const route = useRoute<IdentityDetailScreenRouteProp>();
  const navigation = useNavigation<IdentityDetailScreenNavigationProp>();
  const {identityId} = route.params;
  const {getIdentityById, deleteIdentity} = useIdentities();

  const identity = getIdentityById(identityId);

  // Track screen views for analytics
  useScreenTracking('IdentityDetail');

  // Validate the identity and get summary
  const validationSummary = useMemo(() => {
    if (!identity) {return null;}
    const validationService = IdentityValidationService.getInstance();
    return validationService.getValidationSummary(identity);
  }, [identity]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Identity',
      'Are you sure you want to delete this identity? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIdentity(identityId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete identity');
            }
          },
        },
      ]
    );
  };

  if (!identity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Identity not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.name}>{identity.name}</Text>
          <View style={[
            styles.statusBadge,
            identity.isVerified ? styles.verifiedBadge : styles.pendingBadge,
          ]}>
            <Text style={[
              styles.statusText,
              identity.isVerified ? styles.verifiedText : styles.pendingText,
            ]}>
              {identity.isVerified ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>

          {/* Validation Score Display */}
          {validationSummary && (
            <View style={[
              styles.validationBadge,
              styles[`${validationSummary.level}Badge`],
            ]}>
              <Text style={[
                styles.validationText,
                styles[`${validationSummary.level}Text`],
              ]}>
                {validationSummary.level.toUpperCase()} ({validationSummary.score}/100)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{identity.email}</Text>
          </View>
          {identity.phone && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.fieldValue}>{identity.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity Details</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date Added</Text>
            <Text style={styles.fieldValue}>
              {identity.dateAdded.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>QR Code Data</Text>
            <Text style={styles.fieldValue} numberOfLines={2}>
              {identity.qrData}
            </Text>
          </View>
        </View>

        {identity.additionalData && Object.keys(identity.additionalData).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            {Object.entries(identity.additionalData).map(([key, value]) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={styles.fieldValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Validation Issues and Recommendations */}
        {validationSummary && (validationSummary.primaryIssues.length > 0 || validationSummary.recommendations.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identity Health</Text>

            {validationSummary.primaryIssues.length > 0 && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Issues Found</Text>
                {validationSummary.primaryIssues.map((issue, index) => (
                  <Text key={index} style={styles.issueText}>• {issue}</Text>
                ))}
              </View>
            )}

            {validationSummary.recommendations.length > 0 && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Recommendations</Text>
                {validationSummary.recommendations.map((rec, index) => (
                  <Text key={index} style={styles.recommendationText}>• {rec}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Identity</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E8',
  },
  pendingBadge: {
    backgroundColor: '#FFF3CD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedText: {
    color: '#2E7D32',
  },
  pendingText: {
    color: '#F57C00',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    padding: 20,
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  validationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  excellentBadge: {
    backgroundColor: '#E8F5E8',
  },
  goodBadge: {
    backgroundColor: '#E3F2FD',
  },
  fairBadge: {
    backgroundColor: '#FFF3CD',
  },
  poorBadge: {
    backgroundColor: '#FFEBEE',
  },
  validationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  excellentText: {
    color: '#2E7D32',
  },
  goodText: {
    color: '#1976D2',
  },
  fairText: {
    color: '#F57C00',
  },
  poorText: {
    color: '#D32F2F',
  },
  issueText: {
    fontSize: 14,
    color: '#D32F2F',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
});

export default IdentityDetailScreen;
