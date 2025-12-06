import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Menu } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [visible, setVisible] = React.useState(false);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    const changeLanguage = async (lng) => {
        await i18n.changeLanguage(lng);
        closeMenu();
    };

    const getCurrentLanguageLabel = () => {
        return i18n.language === 'ro' ? 'RO' : 'EN';
    };

    return (
        <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={
                <IconButton
                    icon="translate"
                    size={24}
                    onPress={openMenu}
                    iconColor="#4F46E5"
                />
            }
        >
            <Menu.Item
                onPress={() => changeLanguage('ro')}
                title="Română (RO)"
                leadingIcon={i18n.language === 'ro' ? 'check' : null}
            />
            <Menu.Item
                onPress={() => changeLanguage('en')}
                title="English (EN)"
                leadingIcon={i18n.language === 'en' ? 'check' : null}
            />
        </Menu>
    );
}
