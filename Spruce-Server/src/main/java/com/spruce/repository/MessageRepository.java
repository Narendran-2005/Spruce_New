package com.spruce.repository;

import com.spruce.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query("SELECT m FROM Message m WHERE " +
           "(m.senderId = :userId AND m.receiverId = :otherUserId) OR " +
           "(m.senderId = :otherUserId AND m.receiverId = :userId) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findConversation(@Param("userId") Long userId, @Param("otherUserId") Long otherUserId);

    @Query("SELECT m FROM Message m WHERE m.groupId = :groupId ORDER BY m.timestamp ASC")
    List<Message> findByGroupId(@Param("groupId") Long groupId);
}

