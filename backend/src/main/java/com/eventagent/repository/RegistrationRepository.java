package com.eventagent.repository;

import com.eventagent.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByUserId(Long userId);
    Optional<Registration> findByUserIdAndEventId(Long userId, Long eventId);
}
