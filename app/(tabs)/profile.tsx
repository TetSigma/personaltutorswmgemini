import { useEffect, useState } from 'react';
import { Image, Modal, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppStore } from '../../stores';
import { theme } from '../../theme';
import { UIButton, UIIcon, UIPressable, UIText } from '../../ui';

const LANGUAGES = [
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'tr', label: 'Turkish', flag: '🇹🇷' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', label: 'Polish', flag: '🇵🇱' },
  { code: 'uk', label: 'Ukrainian', flag: '🇺🇦' },
] as const;

export default function ProfileScreen() {
  const { user, loading, error, signIn, signOut, trySilentSignIn } =
    useGoogleAuth();

  const learningLanguage = useAppStore((s) => s.learningLanguage);
  const setLearningLanguage = useAppStore((s) => s.setLearningLanguage);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selected = LANGUAGES.find((l) => l.code === learningLanguage);

  useEffect(() => {
    if (!user) trySilentSignIn();
  }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {user ? (
        <View style={styles.card}>
          {user.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <UIIcon name="person" size={40} color={theme.colors.textMuted} />
            </View>
          )}
          <UIText variant="subtitle" style={styles.name}>
            {user.displayName ?? 'User'}
          </UIText>
          <UIText variant="bodySecondary" style={styles.email}>
            {user.email}
          </UIText>

          <View style={styles.signOutWrap}>
            <UIButton
              title="Sign out"
              variant="danger"
              size="md"
              loading={loading}
              onPress={signOut}
            />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <UIIcon name="person" size={40} color={theme.colors.textMuted} />
          </View>
          <UIText variant="subtitle" style={styles.heading}>
            Sign in
          </UIText>
          <UIText variant="bodySecondary" style={styles.desc}>
            Connect your Google account to sync progress and personalise your
            learning experience.
          </UIText>

          <UIButton
            title="Sign in with Google"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={signIn}
          />
        </View>
      )}

      {/* Language picker */}
      <View style={styles.card}>
        <View style={styles.sectionRow}>
          <UIIcon name="language" size="md" color={theme.colors.primary} />
          <UIText variant="subtitle">Learning</UIText>
        </View>

        <UIPressable
          variant="plain"
          style={styles.dropdown}
          onPress={() => setDropdownOpen(true)}
        >
          <UIText variant="body" style={styles.dropdownLabel}>
            {selected ? `${selected.flag}  ${selected.label}` : 'Choose language'}
          </UIText>
          <UIIcon
            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
            size="sm"
            color={theme.colors.textMuted}
          />
        </UIPressable>
      </View>

      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <UIPressable
          variant="plain"
          style={styles.modalOverlay}
          onPress={() => setDropdownOpen(false)}
        >
          <View style={styles.modalSheet}>
            <UIText variant="subtitle" style={styles.modalTitle}>
              Choose language
            </UIText>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.code === learningLanguage;
                return (
                  <UIPressable
                    variant="plain"
                    style={[
                      styles.langRow,
                      isSelected && styles.langRowSelected,
                    ]}
                    onPress={() => {
                      setLearningLanguage(item.code);
                      setDropdownOpen(false);
                    }}
                  >
                    <UIText variant="body" style={styles.langFlag}>
                      {item.flag}
                    </UIText>
                    <UIText
                      variant="body"
                      style={[
                        styles.langLabel,
                        isSelected && styles.langLabelSelected,
                      ]}
                    >
                      {item.label}
                    </UIText>
                    {isSelected && (
                      <UIIcon
                        name="checkmark-circle"
                        size="sm"
                        color={theme.colors.primary}
                      />
                    )}
                  </UIPressable>
                );
              }}
            />
          </View>
        </UIPressable>
      </Modal>

      {error ? (
        <UIText variant="caption" style={styles.error}>
          {error}
        </UIText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.pageBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    textAlign: 'center',
    color: theme.colors.textPrimary,
  },
  email: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  heading: {
    textAlign: 'center',
    color: theme.colors.textPrimary,
  },
  desc: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  signOutWrap: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
  error: {
    color: '#b00020',
    textAlign: 'center',
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.pageBackground,
  },
  dropdownLabel: {
    color: theme.colors.textPrimary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    marginBottom: 12,
    color: theme.colors.textPrimary,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  langRowSelected: {
    backgroundColor: `${theme.colors.primary}12`,
  },
  langFlag: {
    fontSize: 22,
  },
  langLabel: {
    flex: 1,
    color: theme.colors.textPrimary,
  },
  langLabelSelected: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
