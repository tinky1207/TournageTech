// app/(tabs)/society.tsx (Updated with fixes for TS errors)
import { Image, StyleSheet, Text, View, TouchableOpacity, FlatList, NativeSyntheticEvent, NativeScrollEvent, Modal, TextInput, KeyboardAvoidingView, Platform, Animated, Easing, LayoutAnimation, UIManager, Platform as RNPlatform, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Component, ErrorInfo } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { TextStyle } from 'react-native';
import { Entypo } from '@expo/vector-icons';

if (RNPlatform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

const API_URL = 'https://tournagetech-1.onrender.com';

interface Post {
  id: number;
  title: string;
  image_urls?: string[];
  content: string;
  created_at: string;
  like_count: number;
  is_liked: boolean;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  username: string;
  profile_image_url?: string;
  parent_id?: number | null;
  like_count: number;
  is_liked: boolean;
  replies?: Comment[];
}

const LIMIT = 10;

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Text>Something went wrong.</Text>;
    }

    return this.props.children; 
  }
}

const TournamentPage = () => <PostsPage category="tournament" />;
const OnCourtPage = () => <PostsPage category="on_court" />;
const EquipmentPage = () => <PostsPage category="equipment" />;

const PostsPage = ({ category }: { category: string }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);

  useEffect(() => {
    fetchMorePosts().then(() => setInitialLoading(false)).catch(() => setInitialLoading(false));
  }, []);

  const fetchMorePosts = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/posts?category=${category}&page=${page}&limit=${LIMIT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newPosts = res.data;
      setPosts(prev => [...prev, ...newPosts]);
      setHasMore(newPosts.length === LIMIT);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again.');
      Alert.alert('Error', 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    await fetchMorePosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: number) => {
    try {
      const token = await getToken();
      const res = await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { likes, message } = res.data;
      const isLikedNow = message.includes('liked');
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, like_count: likes, is_liked: isLikedNow } : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like the post.');
    }
  };

  const openComments = (postId: number) => {
    setCurrentPostId(postId);
    setModalVisible(true);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <Text style={styles.postTitle}>{item.title}</Text>
      {item.image_urls && item.image_urls.length > 0 && (
        <PostCarousel images={item.image_urls} />
      )}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.likeButton}>
          <Entypo name="thumbs-up" size={20} color="#090b47" />
          <Text style={styles.likeText}>Like</Text>
          {item.like_count > 0 && (
            <>
              <Entypo name="heart" size={18} color="red" style={styles.heartIcon} />
              <Text style={styles.likeCount}>{item.like_count}</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openComments(item.id)} style={styles.commentButton}>
          <Entypo name="chat" size={20} color="#090b47" />
          <Text style={styles.commentText}>Comment</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      <Text style={styles.postTime}>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</Text>
    </View>
  );

  if (initialLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#090b47" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text>{error}</Text>
        <TouchableOpacity onPress={fetchMorePosts}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.postsList}
        onEndReached={fetchMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator size="small" color="#090b47" /> : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CommentsModalContent postId={currentPostId} onClose={() => setModalVisible(false)} getToken={getToken} />
      </Modal>
    </View>
  );
};

const CommentComponent = ({ comment, onReply, onLike, onUpdate, onDelete, currentUsername, deleting }: {
  comment: Comment;
  onReply: (comment: Comment) => void;
  onLike: (commentId: number) => void;
  onUpdate: (commentId: number, updatedContent: string) => void;
  onDelete: (commentId: number) => void;
  currentUsername?: string;
  deleting: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  if (deleting) {
    return null; // Or show a loading spinner
  }

  return (
    <View style={styles.commentWrapper}>
      <View style={styles.commentContainer}>
        <Image
          source={comment.profile_image_url ? { uri: comment.profile_image_url } : require('../../assets/images/user-icon.png')}
          style={styles.commentProfileImage}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{comment.username}</Text>
            {!comment.parent_id && <Text style={styles.commentTime}>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</Text>}
            {comment.username === currentUsername && (
              <>
                {!comment.parent_id && (
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Text style={styles.editButton}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => onDelete(comment.id)}>
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          {isEditing ? (
            <>
              <TextInput
                style={styles.editInput}
                value={editedContent}
                onChangeText={setEditedContent}
                multiline
              />
              <TouchableOpacity onPress={() => {
                onUpdate(comment.id, editedContent);
                setIsEditing(false);
              }}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.commentText1}>{comment.content}</Text>
          )}
          {!comment.parent_id && (
            <TouchableOpacity onPress={() => onReply(comment)} style={styles.replyButton}>
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.commentLike}>
          <TouchableOpacity onPress={() => onLike(comment.id)}>
            <Entypo name={comment.is_liked ? 'heart' : 'heart-outlined'} size={18} color={comment.is_liked ? 'red' : '#888'} />
          </TouchableOpacity>
          {comment.like_count > 0 && <Text style={styles.commentLikeCount}>{comment.like_count}</Text>}
        </View>
      </View>
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesList}>
          {comment.replies.map((item) => (
            <CommentComponent
              key={item.id.toString()}
              comment={item}
              onReply={onReply}
              onLike={onLike}
              onUpdate={onUpdate}
              onDelete={onDelete}
              currentUsername={currentUsername}
              deleting={deleting}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const CommentsModalContent = ({ postId, onClose, getToken }: { postId: number | null; onClose: () => void; getToken: () => Promise<string | null>; }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [userProfile, setUserProfile] = useState<{ profile_image_url?: string, username?: string } | null>(null);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingComments, setDeletingComments] = useState<number[]>([]);

  useEffect(() => {
    if (postId) {
      fetchComments().then(() => setLoadingComments(false)).catch(() => setLoadingComments(false));
      fetchUserProfile();
    }
  }, [postId]);

  const fetchUserProfile = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile(res.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile.');
    }
  };

  const fetchComments = async () => {
    setError(null);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/comments/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tree = buildCommentTree(res.data);
      setComments(tree);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments.');
      Alert.alert('Error', 'Failed to load comments.');
    }
  };

  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    const map: { [key: number]: Comment } = {};
    flatComments.forEach((c) => {
      map[c.id] = { ...c, replies: [] };
    });
    const tree: Comment[] = [];
    flatComments.forEach((c) => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies!.push(map[c.id]);
      } else {
        tree.push(map[c.id]);
      }
    });
    return tree;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !postId) return;
    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      const body = { content: newComment, parentId: replyingTo?.id };
      const res = await axios.post(`${API_URL}/api/comments/${postId}`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const addedComment = res.data;
      setNewComment('');
      setReplyingTo(null);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      fetchComments(); // Refresh tree
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment.');
      Alert.alert('Error', 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: number, updatedContent: string) => {
    try {
      const token = await getToken();
      const res = await axios.put(`${API_URL}/api/comments/${commentId}`, { content: updatedContent }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchComments(); // Refresh tree
    } catch (error) {
      console.error('Error updating comment:', error);
      Alert.alert('Error', 'Failed to update comment.');
    }
  };

 const handleDeleteComment = async (commentId: number) => {
  try {
    const token = await getToken();
    const res = await axios.delete(`${API_URL}/api/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 200 && postId !== null) {
      fetchComments(); // Refetch to update UI
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    Alert.alert('Error', 'Failed to delete comment.');
  }
};

  const handleAddEmoji = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };

  const handleLikeComment = async (commentId: number) => {
    try {
      const token = await getToken();
      const res = await axios.post(`${API_URL}/api/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchComments(); // Refresh tree
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Error', 'Failed to like comment.');
    }
  };

  if (loadingComments) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: '#fff' }}>{error}</Text>
        <TouchableOpacity onPress={fetchComments}>
          <Text style={{ color: '#3897f0' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Comments</Text>
        <TouchableOpacity onPress={onClose}>
          <Entypo name="cross" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={comments}
        renderItem={({ item }) => (
          <CommentComponent
            comment={item}
            onReply={setReplyingTo}
            onLike={handleLikeComment}
            onUpdate={handleUpdateComment}
            onDelete={handleDeleteComment}
            currentUsername={userProfile?.username}
            deleting={deletingComments.includes(item.id)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.commentsList}
      />
      <View style={styles.inputContainer}>
        {replyingTo && (
          <View style={styles.replyingTo}>
            <Text style={styles.replyingToText}>Replying to {replyingTo.username}</Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Text style={styles.cancelReply}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <Image
            source={userProfile?.profile_image_url ? { uri: userProfile.profile_image_url } : require('../../assets/images/user-icon.png')}
            style={styles.inputProfileImage}
          />
          <TextInput
            style={styles.commentInput}
            placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : 'Add a comment...'}
            placeholderTextColor="#888"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
        </View>
        <View style={styles.emojiAndPostContainer}>
          <View style={styles.emojiContainer}>
            {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => handleAddEmoji(emoji)} style={styles.emojiButton}>
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleSubmitComment} disabled={!newComment.trim() || submitting} style={styles.sendButton}>
            {submitting ? (
              <ActivityIndicator size="small" color="#3897f0" />
            ) : (
              <Text style={[styles.sendText, (!newComment.trim() || submitting) && styles.sendTextDisabled]}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const IMAGE_WIDTH = 300;

const PostCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const renderImage = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.postImage} />
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH);
    setCurrentIndex(index);
  };

  return (
    <View>
      <FlatList
        data={images}
        renderItem={renderImage}
        keyExtractor={(item: string, index: number) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
      />
      <View style={styles.dotsContainer}>
        {images.map((_: string, index: number) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentIndex ? '#090b47' : '#ccc' },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default function Society() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('tournament');

  useEffect(() => {
    fetchProfileImage();
  }, []);

  const fetchProfileImage = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200 && res.data.profile_image_url) {
        setProfileImageUrl(res.data.profile_image_url);
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
      Alert.alert('Error', 'Failed to load profile image.');
    }
  };

  const renderPage = () => {
    switch (selectedTab) {
      case 'tournament':
        return <TournamentPage />;
      case 'onCourt':
        return <OnCourtPage />;
      case 'equipment':
        return <EquipmentPage />;
      default:
        return <TournamentPage />;
    }
  };

  const getTitleText = () => {
    switch (selectedTab) {
      case 'tournament':
        return 'Tournament';
      case 'onCourt':
        return 'On court';
      case 'equipment':
        return 'Equipment';
      default:
        return 'Tournament';
    }
  };

  const getTitleStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#090b47',
      marginTop: -10,
      marginBottom: 10,
      marginHorizontal: 20
    };
    let textAlign: 'left' | 'center' | 'right' = 'left';
    if (selectedTab === 'onCourt') {
      textAlign = 'center';
    } else if (selectedTab === 'equipment') {
      textAlign = 'right';
    }
    return { ...baseStyle, textAlign };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <TouchableOpacity onPress={() => router.push('/user-profile')}>
            <Image source={profileImageUrl ? { uri: profileImageUrl } : require('../../assets/images/user-icon.png')} style={styles.userIcon} />
          </TouchableOpacity>
          <Image source={require('../../assets/images/society-text.png')} style={styles.societyImage} />
        </View>
      </View>
      <View style={styles.switchBarContainer}>
        <TouchableOpacity
          style={[
            styles.switchButton,
            selectedTab === 'tournament' ? styles.selectedButton : styles.unselectedButton,
            { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
          ]}
          onPress={() => setSelectedTab('tournament')}
        >
          <Image
            source={require('../../assets/images/rewards.png')}
            style={[
              styles.icon,
              { tintColor: selectedTab === 'tournament' ? '#FFFFFF' : '#090b47' },
            ]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.switchButton,
            selectedTab === 'onCourt' ? styles.selectedButton : styles.unselectedButton,
          ]}
          onPress={() => setSelectedTab('onCourt')}
        >
          <Image
            source={require('../../assets/images/tennis-court.png')}
            style={[
              styles.icon,
              { tintColor: selectedTab === 'onCourt' ? '#FFFFFF' : '#090b47' },
            ]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.switchButton,
            selectedTab === 'equipment' ? styles.selectedButton : styles.unselectedButton,
            { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
          ]}
          onPress={() => setSelectedTab('equipment')}
        >
          <Image
            source={require('../../assets/images/tennis-ball.png')}
            style={[
              styles.icon,
              { tintColor: selectedTab === 'equipment' ? '#FFFFFF' : '#090b47' },
            ]}
          />
        </TouchableOpacity>
      </View>
      <Text style={getTitleStyle()}>{getTitleText()}</Text>
      {renderPage()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 5,
    marginTop: 20
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -15,
  },
  userIcon: {
    width: 55,
    height: 50,
    marginRight: 10,
    borderRadius: 25,
  },
  societyImage: {
    width: 150,
    height: 40,
    resizeMode: 'contain',
    marginLeft: -2
  },
  switchBarContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#090b47',
    marginBottom: 16,
    height: 50,
  },
  switchButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedButton: {
    backgroundColor: '#090b47',
  },
  unselectedButton: {
    backgroundColor: '#FFFFFF',
  },
  icon: {
    width: 24,
    height: 24,
  },
  pageContainer: {
    flex: 1,
  },
  postsList: {
    padding: 16,
  },
  postContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#090b47',
    marginBottom: 10,
  },
  postImage: {
    width: IMAGE_WIDTH,
    height: 300,
    resizeMode: 'contain',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    marginVertical: 8,
    justifyContent: 'flex-start',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#090b47',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  likeText: {
    color: '#090b47',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  heartIcon: {
    marginLeft: 5,
  },
  likeCount: {
    color: 'red',
    marginLeft: 2,
    fontWeight: 'bold',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#090b47',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  commentText: {
    color: '#090b47',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  postTime: {
    fontSize: 12,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  commentsList: {
    padding: 16,
  },
  commentWrapper: {
    marginBottom: 16,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUsername: {
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  commentTime: {
    color: '#888',
    fontSize: 12,
  },
  commentText1: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 4,
  },
  replyButton: {
    marginTop: 1,
  },
  replyText: {
    color: '#888',
    fontSize: 13,
    fontWeight: 'bold',
  },
  commentLike: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 12,
    marginTop: 22,
  },
  commentLikeCount: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  repliesList: {
    marginLeft: 52, // Indent for replies (profile pic width + margin)
    marginTop: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#333',
    paddingLeft: 12,
    marginBottom: -8
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 16,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  replyingTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  replyingToText: {
    color: '#888',
  },
  cancelReply: {
    color: '#888',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40
  },
  inputProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    padding: 10,
    color: '#fff',
    backgroundColor: '#1c1c1e',
  },
  emojiAndPostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -25,
    marginBottom: 20
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  emojiButton: {
    marginRight: 8,
  },
  emoji: {
    fontSize: 24,
  },
  sendButton: {
    alignSelf: 'center',
  },
  sendText: {
    color: '#3897f0',
    fontWeight: 'bold',
  },
  sendTextDisabled: {
    color: '#888',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    color: '#888',
    fontSize: 12,
    marginLeft: 10,
  },
  deleteButton: {
    color: '#888',
    fontSize: 12,
    marginLeft: 10,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 4,
    padding: 8,
    color: '#fff',
    backgroundColor: '#1c1c1e',
    marginVertical: 4,
    marginBottom: -15
  },
  saveButton: {
    color: '#3897f0',
    fontWeight: 'bold',
    marginLeft: 235,
    marginTop: -11
  },
});