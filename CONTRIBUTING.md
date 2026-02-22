# Contributing to LINK

Welcome to the team! We use a structured workflow to ensure code quality and stability.

## 1. Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd link-app
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```

## 2. Collaboration Workflow

We use a **Development Branch Workflow**.
*   **`main`**: detailed production-ready code. DO NOT commit directly here.
*   **`dev`**: The active development branch. All features merge here first.

### Step-by-Step Guide:

1.  **Start from the `dev` branch**:
    Always make sure you are up to date with the latest development changes.
    ```bash
    git checkout dev
    git pull origin dev
    ```

2.  **Create a new branch** for your feature or fix:
    *   Features: `feat/add-login-screen`
    *   Fixes: `fix/sidebar-bug`
    
    ```bash
    git checkout -b feat/my-new-feature
    ```

3.  **Develop**: Make your changes and commit them.
    ```bash
    git add .
    git commit -m "feat: description of changes"
    ```

4.  **Push your branch** to GitHub:
    ```bash
    git push -u origin feat/my-new-feature
    ```

5.  **Create a Pull Request (PR)**:
    *   Go to GitHub.
    *   Click "Compare & pull request".
    *   **IMPORTANT**: Change the "base" branch to **`dev`**.
    *   Request a review from a teammate.

6.  **Merge**: 
    *   Features merge into `dev` via PR.
    *   Project Leads merge `dev` into `main` for releases.

## 3. Code Actions

*   **Linting**: Run `npm run lint` before pushing.
*   **Database**: Include migration files if you change the schema.

## 4. Environment Variables

*   Do not commit `.env.local`. Share new tokens securely with the team.
