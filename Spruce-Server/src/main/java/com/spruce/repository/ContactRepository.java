package com.spruce.repository;

import com.spruce.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    List<Contact> findByUserIdAndStatus(Long userId, String status);
    
    @Query("SELECT c FROM Contact c WHERE " +
           "(c.userId = :userId AND c.contactId = :contactId) OR " +
           "(c.userId = :contactId AND c.contactId = :userId)")
    Optional<Contact> findContact(@Param("userId") Long userId, @Param("contactId") Long contactId);
}






