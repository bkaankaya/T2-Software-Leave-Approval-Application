package com.kaankaya.leave;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveRepository extends JpaRepository<LeaveRequest, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update LeaveRequest l set l.status = :nextStatus where l.id in :ids and l.status = :expectedStatus")
    int updatePendingBatch(@Param("ids") List<Long> ids,
        @Param("expectedStatus") LeaveRequest.Status expectedStatus,
        @Param("nextStatus") LeaveRequest.Status nextStatus);

    List<LeaveRequest> findAllByOrderByIdDesc();
    List<LeaveRequest> findByPersonnelUsernameOrderByIdDesc(String username);
}
