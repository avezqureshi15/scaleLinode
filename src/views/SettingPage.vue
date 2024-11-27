<template>
    <el-card class="container mx-auto" body-class="flex flex-col space-y-10">
        <div class="flex justify-between items-center">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/settings' }">Settings</el-breadcrumb-item>
                <el-breadcrumb-item>Password</el-breadcrumb-item>
            </el-breadcrumb>
        </div>

        <el-form :model="passwordForm" label-position="top" ref="passwordForm" class="w-full">
            <el-form-item label="Old Password" :rules="[{ required: true, message: 'Please enter your old password', trigger: 'blur' }]">
                <el-input type="password" v-model="passwordForm.old_password" autocomplete="off" required/>
            </el-form-item>

            <el-form-item label="New Password" :rules="[{ required: true, message: 'Please enter your new password', trigger: 'blur' }]">
                <el-input type="password" v-model="passwordForm.new_password" autocomplete="off" required/>
            </el-form-item>

            <el-form-item label="Confirm New Password" :rules="[{ required: true, message: 'Please confirm your new password', trigger: 'blur' }, { validator: validateConfirmPassword, trigger: 'blur' }]">
                <el-input type="password" v-model="passwordForm.confirm_password" autocomplete="off" required/>
            </el-form-item>

            <el-form-item>
                <el-button type="primary" @click="updatePassword">Update Password</el-button>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<script>
    import axios from 'axios';

    export default {
        data() {
            return {
                passwordForm: {
                    old_password: '',
                    new_password: '',
                    confirm_password: '',
                },
            };
        },
        methods: {
            validateConfirmPassword(rule, value, callback) {
                if (value !== this.passwordForm.new_password) {
                    callback(new Error('Passwords do not match'));
                } else {
                    callback();
                }
            },
            updatePassword() {
                if (this.passwordForm.old_password && this.passwordForm.confirm_password && this.passwordForm.confirm_password == this.passwordForm.new_password) {
                    const payload = {
                        old_password: this.passwordForm.old_password,
                        new_password: this.passwordForm.new_password,
                    };
                    this.makeRequest('post', 'auth-service/v1/changepassword', payload)
                    .then((response) => {
                        this.$message.success('Password updated successfully');
                        this.passwordForm.old_password = '';
                        this.passwordForm.new_password = '';
                        this.passwordForm.confirm_password = '';
                    })
                    .catch((error) => {
                        console.error('Error updating password:', error);
                        this.$message.error('Error updating password');
                    })
                    .finally(() => {
                        this.loading = false;
                    });
                } else {
                    this.$message.error('Please correct the errors in the form');
                }
            },
        },
    };
</script>
