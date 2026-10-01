package com.farmsaas.config.websocket;

import com.farmsaas.security.jwt.JwtService;
import com.farmsaas.security.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Interceptor ensuring that every WebSocket STOMP connection is authenticated
 * with a valid JWT Token before allowing connection establishment.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String bearerToken = accessor.getFirstNativeHeader("Authorization");
            
            if (!StringUtils.hasText(bearerToken)) {
                bearerToken = accessor.getFirstNativeHeader("token");
            }

            if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
                bearerToken = bearerToken.substring(7);
            }

            if (!StringUtils.hasText(bearerToken) || !jwtService.validateToken(bearerToken)) {
                log.warn("WebSocket connection rejected: Missing or invalid JWT token");
                throw new AccessDeniedException("WebSocket connection rejected: Unauthorized");
            }

            String username = jwtService.extractUsername(bearerToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            accessor.setUser(authentication);
            log.info("WebSocket connection established successfully for user: {}", username);
        }

        return message;
    }
}
