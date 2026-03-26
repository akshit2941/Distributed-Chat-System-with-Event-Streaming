package com.example.distributed_chat_system.interceptor;

import com.example.distributed_chat_system.config.JwtProvider;
import com.example.distributed_chat_system.model.dto.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class JwtInterceptor implements HandlerInterceptor {
    private final JwtProvider jwtProvider;

    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            String token = authHeader.substring(7);

            if (jwtProvider.isTokenValid(token)) {

                Long userId = jwtProvider.getUserId(token);
                String username = jwtProvider.extractUsername(token);

                UserPrincipal user = new UserPrincipal(userId, username);

                // store in request
                request.setAttribute("currentUser", user);
            }
        }

        return true;
    }
}
