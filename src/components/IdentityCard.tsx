import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {Identity} from '../types/Identity';
import {useTheme} from '../context/ThemeContext';
import {Icon, IconNames} from './Icon';
import {IdentityValidation} from '../services/IdentityValidationService';

interface IdentityCardProps {
  identity: Identity;
  validation?: IdentityValidation;
}

const {width: screenWidth} = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.85;
const CARD_HEIGHT = 480;

export const IdentityCard: React.FC<IdentityCardProps> = ({identity, validation}) => {
  const {theme} = useTheme();

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.card, {backgroundColor: theme.colors.card}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.name, {color: theme.colors.text}]}>
          {identity.name || 'Anonymous Identity'}
        </Text>
        {validation && (
          <View style={[styles.scoreBadge, {backgroundColor: getScoreColor(validation.score)}]}>
            <Text style={styles.scoreText}>{validation.score}</Text>
          </View>
        )}
      </View>

      {/* Identity Info */}
      <View style={styles.infoSection}>
        {identity.email && (
          <View style={styles.infoRow}>
            <View style={styles.labelRow}>
              <Icon name={IconNames.email} size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Email</Text>
            </View>
            <Text style={[styles.value, {color: theme.colors.text}]}>{identity.email}</Text>
          </View>
        )}

        {identity.phone && (
          <View style={styles.infoRow}>
            <View style={styles.labelRow}>
              <Icon name={IconNames.phone} size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Phone</Text>
            </View>
            <Text style={[styles.value, {color: theme.colors.text}]}>{identity.phone}</Text>
          </View>
        )}

        {identity.dateOfBirth && (
          <View style={styles.infoRow}>
            <View style={styles.labelRow}>
              <Icon name={IconNames.calendar} size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Date of Birth</Text>
            </View>
            <Text style={[styles.value, {color: theme.colors.text}]}>{identity.dateOfBirth}</Text>
          </View>
        )}

        {identity.address && (
          <View style={styles.infoRow}>
            <View style={styles.labelRow}>
              <Icon name={IconNames.location} size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Address</Text>
            </View>
            <Text style={[styles.value, {color: theme.colors.text}]} numberOfLines={2}>
              {identity.address}
            </Text>
          </View>
        )}
      </View>

      {/* Verification Status */}
      <View style={[styles.verificationSection, {borderTopColor: theme.colors.border}]}>
        <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Status</Text>
        <View style={styles.verificationInfo}>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: identity.isVerified ? theme.colors.success : theme.colors.warning},
            ]}>
            <Icon
              name={identity.isVerified ? IconNames.verified : IconNames.unverified}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>
              {identity.isVerified ? 'Verified' : 'Unverified'}
            </Text>
          </View>
          {identity.hasCredentials && (
            <View style={styles.credentialBadge}>
              <Icon name={IconNames.verified} size={14} color={theme.colors.info} />
              <Text style={[styles.credentialText, {color: theme.colors.info}]}>
                Has Credentials
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Metadata */}
      <View style={[styles.metadata, {borderTopColor: theme.colors.border}]}>
        <Text style={[styles.metaText, {color: theme.colors.textSecondary}]}>
          Added {formatDate(identity.createdAt)}
        </Text>
        {identity.qrData && (
          <Text style={[styles.metaText, {color: theme.colors.textSecondary}]}>
            From QR Code
          </Text>
        )}
      </View>

      {/* Quality Level if validation exists */}
      {validation && (
        <View style={[styles.qualitySection, {backgroundColor: theme.dark ? '#2C2C2E' : '#F9F9F9'}]}>
          <Text style={[styles.qualityLabel, {color: theme.colors.textSecondary}]}>
            Quality: {validation.qualityLevel}
          </Text>
          {validation.recommendations.length > 0 && (
            <Text style={[styles.recommendationText, {color: theme.colors.info}]}>
              {validation.recommendations[0]}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  scoreBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSection: {
    flex: 1,
  },
  infoRow: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  verificationSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
  },
  verificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  credentialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  credentialText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metadata: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
  },
  qualitySection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationText: {
    fontSize: 12,
    marginTop: 4,
  },
});