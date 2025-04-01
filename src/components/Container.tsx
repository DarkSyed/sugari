import React from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar, 
  ViewStyle,
  Keyboard,
  TouchableWithoutFeedback 
} from 'react-native';
import { COLORS, SIZES } from '../constants';

interface ContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardAvoiding?: boolean;
  safeArea?: boolean;
  dismissKeyboardOnTap?: boolean;
}

const Container: React.FC<ContainerProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  keyboardAvoiding = true,
  safeArea = true,
  dismissKeyboardOnTap = true,
}) => {
  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollViewContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          alwaysBounceHorizontal={false}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[styles.contentContainer, contentContainerStyle]}>
        {children}
      </View>
    );
  };

  const content = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {dismissKeyboardOnTap ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {renderContent()}
        </TouchableWithoutFeedback>
      ) : (
        renderContent()
      )}
    </KeyboardAvoidingView>
  ) : (
    renderContent()
  );

  if (safeArea) {
    return (
      <SafeAreaView style={[styles.safeArea, style]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        {content}
      </SafeAreaView>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: SIZES.md,
  },
  contentContainer: {
    flex: 1,
    padding: SIZES.md,
  },
});

export default Container; 