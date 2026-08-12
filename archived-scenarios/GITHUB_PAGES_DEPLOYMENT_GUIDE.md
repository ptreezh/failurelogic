# GitHub Pages Deployment Guide

This guide will help you complete the automated deployment to GitHub Pages and test the CI/CD process.

## Step 1: Enable GitHub Pages in Repository Settings

1. Navigate to your GitHub repository: https://github.com/ptreezh/failurelogic
2. Click on the "Settings" tab
3. In the left sidebar, click on "Pages"
4. Under "Build and deployment", select "Deploy from a branch"
5. Select "main" branch and "/root" folder from the dropdown menus
6. Click "Save" button

## Step 2: Verify GitHub Actions Workflow

The workflow file `.github/workflows/deploy-pages.yml` has already been configured with:
- Automatic cleanup of backend files (Python, API server, tests)
- Proper build process for static hosting
- Deployment to GitHub Pages
- Support for custom domain (failurelogic.pages.dev)

## Step 3: Wait for GitHub Actions to Execute

After enabling GitHub Pages, GitHub will automatically run the workflow:
1. Go to the "Actions" tab in your repository
2. Look for the "Deploy to GitHub Pages" workflow
3. Monitor the workflow execution - it should show green checkmarks when complete

## Step 4: Access Your Deployed Site

Once deployed successfully, your site will be available at:
- Main URL: https://ptreezh.github.io/failurelogic/
- Custom domain (if DNS is configured): https://failurelogic.pages.dev/

## Step 5: Test the Deployed Application

The deployed application will include all the cognitive bias scenarios:
- Coffee Shop Linear Thinking
- Relationship Time Delay
- Investment Confirmation Bias
- Business Strategy Reasoning Game
- Public Policy Making Simulation
- Personal Finance Decision Simulation
- Global Climate Change Policy Making Game
- AI Governance and Regulation Decision Simulation
- Complex Financial Markets Crisis Response Simulation

All scenarios will be available because the frontend mock data has been updated to include all 9 scenarios, ensuring proper functionality even when the backend API is not accessible (as in static GitHub Pages hosting).

## Troubleshooting

If the deployment doesn't work:
1. Check the GitHub Actions logs for any errors
2. Ensure the `main` branch contains the latest code with the workflow file
3. Verify that the repository allows GitHub Pages publishing
4. Confirm that the CNAME file is properly formatted if using a custom domain

## Testing CI/CD Process

To test the CI/CD process:
1. Make a small change to the repository (e.g., edit README.md)
2. Push the change to the `main` branch
3. Observe the GitHub Actions workflow trigger automatically
4. Verify that the change appears on the GitHub Pages site after deployment completes

The CI/CD pipeline is already configured to:
- Automatically build and deploy when changes are pushed to main
- Clean up unnecessary files for static hosting
- Maintain SPA functionality with proper 404 handling
- Preserve API connectivity through remote endpoints