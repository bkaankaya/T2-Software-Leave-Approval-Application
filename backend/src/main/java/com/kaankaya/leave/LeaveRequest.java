package com.kaankaya.leave;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {
    public enum Status { PENDING, APPROVED, REJECTED }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "username", nullable = false)
    private UserAccount personnel;
    @Column(nullable = false) private LocalDate submittedDate;
    @Column(nullable = false, length = 40) private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    @Column(length = 30) private String timeSlot;
    @Column(nullable = false) private int duration;
    @Column(nullable = false, length = 200) private String reason;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15)
    private Status status = Status.PENDING;

    protected LeaveRequest() {}
    public LeaveRequest(UserAccount personnel, LocalDate submittedDate, String leaveType,
            LocalDate startDate, LocalDate endDate, String timeSlot, int duration, String reason) {
        this.personnel = personnel; this.submittedDate = submittedDate; this.leaveType = leaveType;
        this.startDate = startDate; this.endDate = endDate; this.timeSlot = timeSlot;
        this.duration = duration; this.reason = reason;
    }
    public Long getId() { return id; }
    public UserAccount getPersonnel() { return personnel; }
    public LocalDate getSubmittedDate() { return submittedDate; }
    public String getLeaveType() { return leaveType; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getTimeSlot() { return timeSlot; }
    public int getDuration() { return duration; }
    public String getReason() { return reason; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
}
