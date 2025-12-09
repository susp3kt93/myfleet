import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ImageBackground, Animated, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/authSlice';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    const [personalId, setPersonalId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            navigation.replace('Main');
        }
    }, [isAuthenticated, navigation]);

    const handleLogin = () => {
        dispatch(login({ personalId, password }));
    };

    const handleIdChange = (text) => {
        setPersonalId(text.toUpperCase());
        if (error) dispatch(clearError());
    };

    return (
        <ImageBackground
            source={require('../../assets/login-bg.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <LinearGradient
                colors={['rgba(30, 58, 138, 0.8)', 'rgba(30, 58, 138, 0.6)']}
                style={styles.overlay}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <Animated.View
                        style={[
                            styles.contentContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        <Surface style={styles.card}>
                            <View style={styles.header}>
                                <View style={styles.iconContainer}>
                                    <Text style={styles.icon}>🚛</Text>
                                </View>
                                <Text style={styles.title}>MyFleet</Text>
                                <Text style={styles.subtitle}>Welcome back, Driver!</Text>
                            </View>

                            <View style={styles.form}>
                                <TextInput
                                    label="Personal ID"
                                    value={personalId}
                                    onChangeText={handleIdChange}
                                    mode="outlined"
                                    style={styles.input}
                                    left={<TextInput.Icon icon="account" color="#6B7280" />}
                                    autoCapitalize="characters"
                                    outlineColor="#E5E7EB"
                                    activeOutlineColor="#4F46E5"
                                />

                                <TextInput
                                    label="Password"
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (error) dispatch(clearError());
                                    }}
                                    secureTextEntry={!showPassword}
                                    mode="outlined"
                                    style={styles.input}
                                    left={<TextInput.Icon icon="lock" color="#6B7280" />}
                                    right={
                                        <TextInput.Icon
                                            icon={showPassword ? "eye-off" : "eye"}
                                            color="#6B7280"
                                            onPress={() => setShowPassword(!showPassword)}
                                        />
                                    }
                                    outlineColor="#E5E7EB"
                                    activeOutlineColor="#4F46E5"
                                />

                                {error && (
                                    <HelperText type="error" visible={!!error} style={styles.errorText}>
                                        {error}
                                    </HelperText>
                                )}

                                <Button
                                    mode="contained"
                                    onPress={handleLogin}
                                    loading={loading}
                                    disabled={loading}
                                    style={styles.button}
                                    contentStyle={styles.buttonContent}
                                    labelStyle={styles.buttonLabel}
                                >
                                    Sign In
                                </Button>
                            </View>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Demo: DRV-TE-001 / password123</Text>
                            </View>
                        </Surface>
                    </Animated.View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    card: {
        padding: 32,
        borderRadius: 24,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 64,
        height: 64,
        backgroundColor: '#EEF2FF',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    form: {
        width: '100%',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#F9FAFB',
    },
    button: {
        marginTop: 8,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        elevation: 4,
    },
    buttonContent: {
        height: 56,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    errorText: {
        marginBottom: 16,
        fontSize: 14,
    },
    footer: {
        marginTop: 24,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 16,
    },
    footerText: {
        color: '#6B7280',
        fontSize: 12,
    },
});
