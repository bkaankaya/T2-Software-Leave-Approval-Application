package com.kaankaya.leave;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findAllByOrderByIdDesc();
    List<LeaveRequest> findByPersonnelUsernameOrderByIdDesc(String username);
}
