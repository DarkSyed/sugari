import React from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { COLORS, SIZES, APP_NAME } from "../constants";

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.subtitle}>Your Personal Diabetes Assistant</Text>
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: SIZES.lg,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: SIZES.xxl,
  },
  loader: {
    marginTop: SIZES.lg,
  },
});

export default SplashScreen;
