import { Stack } from 'expo-router';

export default function ExamplesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: '#1a1a2e',
        },
      }}
    >
      <Stack.Screen
        name="01-connect-wallet"
        options={{
          title: 'Connect Wallet',
        }}
      />
      <Stack.Screen
        name="02-gasless-transfer"
        options={{
          title: 'Gasless Transfer',
        }}
      />
      <Stack.Screen
        name="03-raydium-swap"
        options={{
          title: 'Raydium Swap',
        }}
      />
    </Stack>
  );
}
