
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Menu, Button } from 'react-native-paper';
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

    return (
        <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={
                <Button
                    onPress={openMenu}
                    mode="text"
                    compact
                    labelStyle={{ fontSize: 24 }}
                    textColor="#000"
                >
                    {i18n.language === 'ro' ? '🇷🇴' : '🇬🇧'}
                </Button>
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

const styles = StyleSheet.create({});
