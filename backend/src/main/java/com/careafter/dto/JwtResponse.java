package com.careafter.dto;

public record JwtResponse(String token, String tokenType, String firstName, String lastName, String role) {
}
