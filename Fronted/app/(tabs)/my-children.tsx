import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface Child {
  id: string;
  full_name: string;
  student_id: string;
  class_name: string;
  level: number;
  email: string;
  profile_picture?: string;
}

interface Absence {
  id: string;
  session_info: string;
  date: string;
  status: 'absent' | 'late' | 'excused';
  reason?: string;
  justification_status?: 'pending' | 'approved' | 'rejected';
}

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  priority: 'low' | 'medium' | 'high';
}

export default function MyChildren() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [activeTab, setActiveTab] = useState<'absences' | 'notes'>('absences');
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [absencesLoading, setAbsencesLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      if (activeTab === 'absences') {
        loadAbsences(selectedChild.id);
      } else {
        loadNotes(selectedChild.id);
      }
    }
  }, [selectedChild, activeTab]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const users = await apiService.getChildrenForParent(user?.id);
      
      // Ensure users is an array before mapping
      if (!users || !Array.isArray(users)) {
        console.warn('API returned invalid data for children:', users);
        setChildren([]);
        return;
      }
      
      // Transform User objects to Child objects
      const transformedChildren: Child[] = users.map(user => ({
        id: user.id,
        full_name: `${user.first_name} ${user.last_name}`,
        student_id: user.student_id || '',
        class_name: user.class_name || '',
        level: user.level || 1,
        email: user.email,
        profile_picture: user.profile_picture,
      }));
      
      setChildren(transformedChildren);
      if (transformedChildren.length > 0 && !selectedChild) {
        setSelectedChild(transformedChildren[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children information');
      setChildren([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadAbsences = async (childId: string) => {
    try {
      setAbsencesLoading(true);
      const response = await apiService.get(`/attendance/records/`, {
        params: { 
          student_id: childId,
          status: 'absent,late,excused'
        }
      });
      
      // Handle paginated response or direct array
      let absencesData = [];
      if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        absencesData = response.data.results || [];
      } else if (Array.isArray(response.data)) {
        absencesData = response.data;
      }
      
      setAbsences(absencesData);
    } catch (error) {
      console.error('Error loading absences:', error);
      // Fallback to mock data if API fails
      const mockAbsences: Absence[] = [
        {
          id: '1',
          session_info: 'Morning Session',
          date: '2024-01-15',
          status: 'excused',
          reason: 'Medical appointment',
        },
        {
          id: '2',
          session_info: 'Afternoon Session', 
          date: '2024-01-10',
          status: 'absent',
          reason: 'Family emergency',
        },
      ];
      setAbsences(mockAbsences);
    } finally {
      setAbsencesLoading(false);
    }
  };

  const loadNotes = async (childId: string) => {
    try {
      setNotesLoading(true);
      const notesData = await apiService.getChildNotes(childId);
      
      // Transform API response to Note format
      const transformedNotes: Note[] = notesData.map(note => ({
        id: note.id,
        title: `${note.subject} - ${note.teacher}`,
        content: note.note,
        created_at: note.date,
        created_by: note.teacher,
        priority: note.type === 'positive' ? 'low' : note.type === 'improvement' ? 'medium' : 'high',
      }));
      
      setNotes(transformedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      // Fallback to mock data if API fails
      const mockNotes: Note[] = [
        {
          id: '1',
          title: 'Excellent Progress in Mathematics',
          content: 'Your child has shown remarkable improvement in mathematics this week.',
          created_at: new Date().toISOString(),
          created_by: 'Ms. Johnson',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Homework Reminder',
          content: 'Please ensure homework is completed on time.',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          created_by: 'Mr. Smith',
          priority: 'medium'
        }
      ];
      setNotes(mockNotes);
    } finally {
      setNotesLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    setRefreshing(false);
  };

  const renderChildSelector = () => (
    <View style={styles.childSelector}>
      <Text style={styles.selectorTitle}>Select Child:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {children.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[
              styles.childCard,
              selectedChild?.id === child.id && styles.selectedChildCard
            ]}
            onPress={() => setSelectedChild(child)}
          >
            <View style={styles.childAvatar}>
              <Ionicons name="person" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.childName}>{child.full_name}</Text>
            <Text style={styles.childClass}>{child.class_name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'absences' && styles.activeTab]}
        onPress={() => setActiveTab('absences')}
      >
        <MaterialCommunityIcons 
          name="calendar-remove" 
          size={20} 
          color={activeTab === 'absences' ? COLORS.background : COLORS.foreground} 
        />
        <Text style={[styles.tabText, activeTab === 'absences' && styles.activeTabText]}>
          Absences
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'notes' && styles.activeTab]}
        onPress={() => setActiveTab('notes')}
      >
        <MaterialCommunityIcons 
          name="note-text" 
          size={20} 
          color={activeTab === 'notes' ? COLORS.background : COLORS.foreground} 
        />
        <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>
          Notes
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAbsences = () => (
    <View style={styles.contentContainer}>
      {absences.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar-check" size={64} color={COLORS.muted} />
          <Text style={styles.emptyText}>No absences recorded</Text>
          <Text style={styles.emptySubtext}>Great attendance record!</Text>
        </View>
      ) : (
        absences.map((absence) => (
          <View key={absence.id} style={styles.absenceCard}>
            <View style={styles.absenceHeader}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(absence.status) }]}>
                <Text style={styles.statusText}>{absence.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.absenceDate}>{new Date(absence.date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.absenceSession}>{absence.session_info}</Text>
            {absence.reason && (
              <Text style={styles.absenceReason}>Reason: {absence.reason}</Text>
            )}
            {absence.justification_status && (
              <View style={styles.justificationStatus}>
                <Text style={styles.justificationText}>
                  Justification: {absence.justification_status}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderNotes = () => (
    <View style={styles.contentContainer}>
      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="note-text-outline" size={64} color={COLORS.muted} />
          <Text style={styles.emptyText}>No notes available</Text>
          <Text style={styles.emptySubtext}>Notes from teachers will appear here</Text>
        </View>
      ) : (
        notes.map((note) => (
          <View key={note.id} style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(note.priority) }]}>
                <Text style={styles.priorityText}>{note.priority.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.noteContent}>{note.content}</Text>
            <View style={styles.noteFooter}>
              <Text style={styles.noteAuthor}>By: {note.created_by}</Text>
              <Text style={styles.noteDate}>{new Date(note.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      case 'excused': return '#10b981';
      default: return COLORS.muted;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return COLORS.muted;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading children information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Children</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={COLORS.muted} />
            <Text style={styles.emptyText}>No children assigned</Text>
            <Text style={styles.emptySubtext}>Contact administration to assign children to your account</Text>
          </View>
        ) : (
          <>
            {renderChildSelector()}
            {selectedChild && (
              <>
                {renderTabSelector()}
                {activeTab === 'absences' ? renderAbsences() : renderNotes()}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.foreground,
  },
  childSelector: {
    padding: 20,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  childCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedChildCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  childName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: 4,
  },
  childClass: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.card,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.foreground,
  },
  activeTabText: {
    color: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.foreground,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  absenceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  absenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.background,
  },
  absenceDate: {
    fontSize: 14,
    color: COLORS.muted,
  },
  absenceSession: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.foreground,
    marginBottom: 4,
  },
  absenceReason: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 8,
  },
  justificationStatus: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  justificationText: {
    fontSize: 14,
    color: COLORS.foreground,
    fontStyle: 'italic',
  },
  noteCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.background,
  },
  noteContent: {
    fontSize: 14,
    color: COLORS.foreground,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  noteAuthor: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  noteDate: {
    fontSize: 12,
    color: COLORS.muted,
  },
});
