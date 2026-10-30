package com.kaankaya.leave;

import java.time.LocalDate;
import java.util.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class LeaveController {
    private final UserRepository users;
    private final LeaveRepository leaves;
    public LeaveController(UserRepository users, LeaveRepository leaves) {
        this.users = users; this.leaves = leaves;
    }

    public record FormInput(LocalDate tarih, @NotBlank String izinTuru,
        LocalDate baslangicTarihi, LocalDate bitisTarihi,
        String izinSaatAraligi, @NotBlank @Size(max = 200) String izinGerekcesi) {}
    public record Ids(@NotEmpty List<Long> leaveIds) {}
    public record Person(String username) {}
    public record LeaveView(Long id, Person personnel, LocalDate tarih, String izinTuru,
        LocalDate baslangicTarihi, LocalDate bitisTarihi,
        String izinSaatAraligi, String izinSuresi, String izinGerekcesi, String durum) {
        static LeaveView of(LeaveRequest leave) {
            String label = switch (leave.getStatus()) {
                case PENDING -> "Beklemede";
                case APPROVED -> "Onaylandı";
                case REJECTED -> "Reddedildi";
            };
            return new LeaveView(leave.getId(), new Person(leave.getPersonnel().getUsername()),
                leave.getSubmittedDate(), leave.getLeaveType(), leave.getStartDate(),
                leave.getEndDate(), leave.getTimeSlot(), Integer.toString(leave.getDuration()),
                leave.getReason(), label);
        }
    }

    @PostMapping("/admin")
    @Transactional
    public LeaveView submit(@Valid @RequestBody FormInput input, Authentication auth) {
        UserAccount user = users.findById(auth.getName()).orElseThrow();
        int daysOrHours = LeaveRules.calculate(input.izinTuru(), input.tarih(),
            input.baslangicTarihi(), input.bitisTarihi(), input.izinSaatAraligi());
        if (input.izinGerekcesi().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Leave reason is required");
        }
        LeaveRequest leave = new LeaveRequest(user, input.tarih(), input.izinTuru(),
            input.baslangicTarihi(), input.bitisTarihi(), input.izinSaatAraligi(),
            daysOrHours, input.izinGerekcesi().trim());
        return LeaveView.of(leaves.saveAndFlush(leave));
    }

    @GetMapping("/leave/leaves")
    @Transactional(readOnly = true)
    public List<LeaveView> all() {
        return leaves.findAllByOrderByIdDesc().stream().map(LeaveView::of).toList();
    }

    @GetMapping("/leave/{username}")
    @Transactional(readOnly = true)
    public List<LeaveView> personal(@PathVariable String username, Authentication auth) {
        if (!username.equals(auth.getName())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return leaves.findByPersonnelUsernameOrderByIdDesc(username).stream().map(LeaveView::of).toList();
    }

    @PostMapping("/admin/approve-leaves")
    @Transactional
    public Map<String, Integer> approve(@Valid @RequestBody Ids input) {
        return update(input, LeaveRequest.Status.APPROVED);
    }

    @PostMapping("/admin/reject-leaves")
    @Transactional
    public Map<String, Integer> reject(@Valid @RequestBody Ids input) {
        return update(input, LeaveRequest.Status.REJECTED);
    }

    private Map<String, Integer> update(Ids input, LeaveRequest.Status newStatus) {
        if (input.leaveIds().contains(null) || new HashSet<>(input.leaveIds()).size() != input.leaveIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or duplicate leave IDs");
        }
        List<LeaveRequest> found = leaves.findAllById(input.leaveIds());
        if (found.size() != input.leaveIds().size()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown leave ID");
        if (found.stream().anyMatch(leave -> leave.getStatus() != LeaveRequest.Status.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending requests can be updated");
        }
        found.forEach(leave -> leave.setStatus(newStatus));
        leaves.saveAll(found);
        return Map.of("updated", found.size());
    }
}
