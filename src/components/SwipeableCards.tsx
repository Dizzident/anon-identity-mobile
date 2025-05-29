import React, {useRef, useState} from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import {Identity} from '../types/Identity';
import {IdentityCard} from './IdentityCard';
import {useTheme} from '../context/ThemeContext';
import {IdentityValidation} from '../services/IdentityValidationService';

interface SwipeableCardsProps {
  identities: Identity[];
  validations: Map<string, IdentityValidation>;
  onSwipeLeft?: (identity: Identity) => void;
  onSwipeRight?: (identity: Identity) => void;
  onCardPress?: (identity: Identity) => void;
  onEmptyAction?: () => void;
}

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;
const SWIPE_OUT_DURATION = 250;

export const SwipeableCards: React.FC<SwipeableCardsProps> = ({
  identities,
  validations,
  onSwipeLeft,
  onSwipeRight,
  onCardPress,
  onEmptyAction,
}) => {
  const {theme} = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const swipeAnimatedValue = useRef(new Animated.Value(0)).current;

  const rotate = swipeAnimatedValue.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const rotateAndTranslate = {
    transform: [
      {
        rotate,
      },
      ...position.getTranslateTransform(),
    ],
  };

  const likeOpacity = swipeAnimatedValue.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = swipeAnimatedValue.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  const nextCardOpacity = swipeAnimatedValue.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [1, 0, 1],
    extrapolate: 'clamp',
  });

  const nextCardScale = swipeAnimatedValue.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [1, 0.8, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        position.setValue({x: gestureState.dx, y: gestureState.dy});
        swipeAnimatedValue.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'right' | 'left') => {
    const x = direction === 'right' ? screenWidth + 100 : -screenWidth - 100;
    Animated.timing(position, {
      toValue: {x, y: 0},
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'right' | 'left') => {
    const item = identities[currentIndex];
    if (direction === 'right' && onSwipeRight) {
      onSwipeRight(item);
    } else if (direction === 'left' && onSwipeLeft) {
      onSwipeLeft(item);
    }
    
    position.setValue({x: 0, y: 0});
    swipeAnimatedValue.setValue(0);
    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: {x: 0, y: 0},
      friction: 5,
      tension: 40,
      useNativeDriver: false,
    }).start();
    Animated.spring(swipeAnimatedValue, {
      toValue: 0,
      friction: 5,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const renderCards = () => {
    if (currentIndex >= identities.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>
            No More Identities
          </Text>
          <Text style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
            Add more identities by scanning QR codes
          </Text>
          {onEmptyAction && (
            <TouchableOpacity
              style={[styles.addButton, {backgroundColor: theme.colors.primary}]}
              onPress={onEmptyAction}>
              <Text style={styles.addButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return identities
      .map((item, i) => {
        if (i < currentIndex) {
          return null;
        } else if (i === currentIndex) {
          return (
            <Animated.View
              {...panResponder.panHandlers}
              key={item.id}
              style={[rotateAndTranslate, styles.cardContainer]}>
              <Animated.View
                style={[
                  styles.likeLabel,
                  {opacity: likeOpacity, borderColor: theme.colors.success},
                ]}>
                <Text style={[styles.likeLabelText, {color: theme.colors.success}]}>KEEP</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.nopeLabel,
                  {opacity: nopeOpacity, borderColor: theme.colors.error},
                ]}>
                <Text style={[styles.nopeLabelText, {color: theme.colors.error}]}>SKIP</Text>
              </Animated.View>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onCardPress && onCardPress(item)}>
                <IdentityCard identity={item} validation={validations.get(item.id)} />
              </TouchableOpacity>
            </Animated.View>
          );
        } else if (i === currentIndex + 1) {
          return (
            <Animated.View
              key={item.id}
              style={[
                styles.cardContainer,
                {
                  opacity: nextCardOpacity,
                  transform: [{scale: nextCardScale}],
                },
              ]}>
              <IdentityCard identity={item} validation={validations.get(item.id)} />
            </Animated.View>
          );
        }
        return null;
      })
      .reverse();
  };

  return <View style={styles.container}>{renderCards()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    left: 40,
    zIndex: 1000,
    transform: [{rotate: '-30deg'}],
    borderWidth: 3,
    borderRadius: 8,
    padding: 8,
  },
  likeLabelText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    right: 40,
    zIndex: 1000,
    transform: [{rotate: '30deg'}],
    borderWidth: 3,
    borderRadius: 8,
    padding: 8,
  },
  nopeLabelText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});