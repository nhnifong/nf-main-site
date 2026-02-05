
Fun locally

    docker run -p 127.0.0.1:8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:26.5.2 start-dev

Admin console

    http://localhost:8080/admin

Login as test user

    http://localhost:8080/realms/stringman_users/account