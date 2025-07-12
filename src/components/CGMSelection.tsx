import React from "react";
import { View, Text, TouchableOpacity, Pressable, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { CGMBrand, ROUTES } from "../types";
import { CGMStackParamList } from "../types/navigation";
import Button from "./Button";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const CGM_BRANDS: CGMBrand[] = ["Dexcom", "Freestyle Libre", "Medtronic"];

type NavigationProp = StackNavigationProp<CGMStackParamList, typeof ROUTES.PAIR_CGM>;

const CGMSelection: React.FC<Props> = ({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp>();

  const handleSelectBrand = (brand: CGMBrand) => {
    onClose();
    navigation.navigate(ROUTES.PAIR_CGM, { brand });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View className="absolute inset-0 justify-center px-6">
        <View className="bg-white rounded-2xl p-6 mx-auto w-full max-w-md shadow-lg">
          <Text className="text-lg font-semibold text-center mb-4">
            Choose Your Monitor
          </Text>

          <View className="space-y-3">
            {CGM_BRANDS.map((brand) => (
              <TouchableOpacity
                key={brand}
                onPress={() => handleSelectBrand(brand)}
                className="border-[3px] border-gray-300 p-4 rounded-xl active:border-blue-600"
              >
                <Text className="text-base font-medium text-center">
                  {brand}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mt-6">
            <Button title="Cancel" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CGMSelection;
