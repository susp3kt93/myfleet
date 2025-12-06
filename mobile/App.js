import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store';
import { useDispatch, useSelector } from 'react-redux';
import { loadStoredAuth } from './src/store/authSlice';
import { setupNotificationListeners, registerPushToken } from './src/services/notificationService';
import './src/i18n'; // Initialize i18n

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import TaskDetailsScreen from './src/screens/TaskDetailsScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [isLoading, setIsLoading] = React.useState(true);
    const navigationRef = useRef();

    // Load stored auth on app start
    useEffect(() => {
        dispatch(loadStoredAuth()).finally(() => {
            setIsLoading(false);
        });
    }, []);

    // Setup notification listeners and register token when authenticated
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // Register push token with backend
        registerPushToken().catch(err => {
            console.error('[App] Error registering push token:', err);
        });

        // Setup notification listeners
        const cleanup = setupNotificationListeners(
            // onNotificationReceived (foreground)
            (notification) => {
                console.log('[App] Notification received in foreground:', notification);
                // You can show a custom in-app banner here if desired
            },
            // onNotificationTapped
            (data) => {
                console.log('[App] Notification tapped with data:', data);

                // Navigate based on notification data
                if (data.taskId && navigationRef.current) {
                    navigationRef.current.navigate('TaskDetails', { taskId: data.taskId });
                }
            }
        );

        // Cleanup on unmount or logout
        return cleanup;
    }, [isAuthenticated, user]);

    if (isLoading) {
        return null;
    }

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName={isAuthenticated ? "Main" : "Splash"}
            >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Main" component={MainScreen} />
                <Stack.Screen
                    name="TaskDetails"
                    component={TaskDetailsScreen}
                    options={{
                        headerShown: true,
                        title: 'Detalii Task',
                        headerBackTitle: 'Înapoi',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <ReduxProvider store={store}>
            <PaperProvider>
                <AppNavigator />
            </PaperProvider>
        </ReduxProvider>
    );
}
