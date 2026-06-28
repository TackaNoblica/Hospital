package com.careafter.repository;

import com.careafter.model.ChatMessage;
import com.careafter.model.Conversation;
import com.careafter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversationOrderBySentAtAsc(Conversation conversation);
    long countByConversationInAndIsReadFalseAndSenderNot(List<Conversation> conversations, User sender);
    List<ChatMessage> findByConversationInAndIsReadFalseAndSenderNot(List<Conversation> conversations, User sender);
}
