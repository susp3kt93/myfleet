import './globals.css';
import { ReduxProvider } from '../lib/ReduxProvider';
import { LanguageProvider } from '../contexts/LanguageContext';

export const metadata = {
    title: 'MyFleet - Task & Shift Management',
    description: 'Fleet management system for drivers and administrators',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <LanguageProvider>
                    <ReduxProvider>
                        {children}
                    </ReduxProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
