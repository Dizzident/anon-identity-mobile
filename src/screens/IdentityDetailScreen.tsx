import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import {RouteProp, useRoute, useNavigation, useTheme} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
  const theme = useTheme();
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

  const handleCopy = (field: string, value: string) => {
    Clipboard.setString(value);
    Alert.alert('Copied', `${field} copied to clipboard`);
  };

  const handleShare = async () => {
    if (!identity) return;
    
    try {
      const message = `Identity: ${identity.name}\nEmail: ${identity.email}${identity.phone ? `\nPhone: ${identity.phone}` : ''}`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Failed to share identity');
    }
  };

  if (!identity) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.errorText, {color: theme.colors.textSecondary}]}>Identity not found</Text>
          <TouchableOpacity 
            style={[styles.backButton, {backgroundColor: theme.colors.primary}]} 
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Determine score color based on validation level
  const getScoreColor = (level: string) => {
    switch (level) {
      case 'excellent': return theme.colors.success;
      case 'good': return theme.colors.info;
      case 'fair': return theme.colors.warning;
      case 'poor': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.header, {backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border}]}>
          <View style={styles.headerTop}>
            <Text style={[styles.name, {color: theme.colors.text}]}>{identity.name}</Text>
            <TouchableOpacity onPress={handleShare}>
              <Icon name="share" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.badges}>
            <View style={[
              styles.statusBadge,
              {backgroundColor: identity.isVerified ? theme.colors.success + '20' : theme.colors.warning + '20'},
            ]}>
              <Icon 
                name={identity.isVerified ? 'verified-user' : 'pending'} 
                size={16} 
                color={identity.isVerified ? theme.colors.success : theme.colors.warning}
              />
              <Text style={[
                styles.statusText,
                {color: identity.isVerified ? theme.colors.success : theme.colors.warning},
              ]}>
                {identity.isVerified ? 'Verified' : 'Pending Verification'}
              </Text>
            </View>

            {/* Validation Score Display */}
            {validationSummary && (
              <View style={[
                styles.validationBadge,
                {backgroundColor: getScoreColor(validationSummary.level) + '20'},
              ]}>
                <Icon 
                  name={validationSummary.score >= 80 ? 'check-circle' : validationSummary.score >= 60 ? 'info' : 'warning'} 
                  size={16} 
                  color={getScoreColor(validationSummary.level)}
                />
                <Text style={[
                  styles.validationText,
                  {color: getScoreColor(validationSummary.level)},
                ]}>
                  {validationSummary.level.toUpperCase()} ({validationSummary.score}/100)
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.section, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Contact Information</Text>
          
          <TouchableOpacity 
            style={styles.field} 
            onPress={() => handleCopy('Email', identity.email)}
          >
            <View style={styles.fieldRow}>
              <Icon name="email" size={20} color={theme.colors.primary} />
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, {color: theme.colors.textSecondary}]}>Email</Text>
                <Text style={[styles.fieldValue, {color: theme.colors.text}]}>{identity.email}</Text>
              </View>
              <Icon name="content-copy" size={18} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
          
          {identity.phone && (
            <TouchableOpacity 
              style={styles.field} 
              onPress={() => handleCopy('Phone', identity.phone!)}
            >
              <View style={styles.fieldRow}>
                <Icon name="phone" size={20} color={theme.colors.primary} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, {color: theme.colors.textSecondary}]}>Phone</Text>
                  <Text style={[styles.fieldValue, {color: theme.colors.text}]}>{identity.phone}</Text>
                </View>
                <Icon name="content-copy" size={18} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.section, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Identity Details</Text>
          
          <View style={styles.field}>
            <View style={styles.fieldRow}>
              <Icon name="calendar-today" size={20} color={theme.colors.primary} />
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, {color: theme.colors.textSecondary}]}>Date Added</Text>
                <Text style={[styles.fieldValue, {color: theme.colors.text}]}>
                  {identity.dateAdded.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.field} 
            onPress={() => handleCopy('QR Code Data', identity.qrData)}
          >
            <View style={styles.fieldRow}>
              <Icon name="qr-code" size={20} color={theme.colors.primary} />
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, {color: theme.colors.textSecondary}]}>QR Code Data</Text>
                <Text style={[styles.fieldValue, {color: theme.colors.text}]} numberOfLines={2}>
                  {identity.qrData}
                </Text>
              </View>
              <Icon name="content-copy" size={18} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {identity.additionalData && Object.keys(identity.additionalData).length > 0 && (
          <View style={[styles.section, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Additional Information</Text>
            {Object.entries(identity.additionalData).map(([key, value]) => (
              <View key={key} style={styles.field}>
                <View style={styles.fieldRow}>
                  <Icon name="info" size={20} color={theme.colors.primary} />
                  <View style={styles.fieldContent}>
                    <Text style={[styles.fieldLabel, {color: theme.colors.textSecondary}]}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                    <Text style={[styles.fieldValue, {color: theme.colors.text}]}>{String(value)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Validation Issues and Recommendations */}
        {validationSummary && (validationSummary.primaryIssues.length > 0 || validationSummary.recommendations.length > 0) && (
          <View style={[styles.section, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              <Icon name="favorite" size={20} color={theme.colors.primary} /> Identity Health
            </Text>

            {validationSummary.primaryIssues.length > 0 && (
              <View style={styles.field}>
                <View style={styles.fieldRow}>
                  <Icon name="warning" size={20} color={theme.colors.error} />
                  <View style={styles.fieldContent}>
                    <Text style={[styles.fieldLabel, {color: theme.colors.textSecondary}]}>Issues Found</Text>
                    {validationSummary.primaryIssues.map((issue, index) => (
                      <Text key={index} style={[styles.issueText, {color: theme.colors.error}]}>• {issue}</Text>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {validationSummary.recommendations.length > 0 && (
              <View style={styles.field}>
                <View style={styles.fieldRow}>
                  <Icon name="lightbulb" size={20} color={theme.colors.info} />
                  <View style={styles.fieldContent}>
                    <Text style={[styles.fieldLabel, {color: theme.colors.textSecondary}]}>Recommendations</Text>
                    {validationSummary.recommendations.map((rec, index) => (
                      <Text key={index} style={[styles.recommendationText, {color: theme.colors.info}]}>• {rec}</Text>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.deleteButton, {backgroundColor: theme.colors.error}]} 
            onPress={handleDelete}
          >
            <Icon name="delete" size={20} color="#fff" />
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  field: {
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    marginTop: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  issueText: {
    fontSize: 14,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default IdentityDetailScreen;
