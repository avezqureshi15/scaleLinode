<template>
    <el-card class="container mx-auto" body-class="flex flex-col space-y-10">
        <div class="flex justify-between items-center">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/environments' }">Environments</el-breadcrumb-item>
            </el-breadcrumb>
            <div class="flex flex-row space-x-2">
                <el-button type="primary" icon="Plus" @click="showAddEnvironmentDialog = true">Add Environment</el-button>
                <el-button type="success" icon="Refresh" circle @click="fetchEnvironments()"></el-button>
            </div>
        </div>
        <el-table :data="environments" v-loading="loading" class="w-full" stripe>
            <el-table-column prop="id" label="ID" />
            <el-table-column prop="name" label="Name" />
            <el-table-column label="Actions" width="300" align="center">
                <template #default="scope">
                    <el-button type="info" icon="Setting" size="small" @click="manage(scope.row)">Manage</el-button>
                    <el-button type="primary" icon="Edit" size="small" @click="editEnvironment(scope.row)">Edit</el-button>
                    <el-button type="danger" icon="Delete" size="small" @click="confirmDeleteEnvironment(scope.row.id)">Delete</el-button>
                </template>
            </el-table-column>
        </el-table>

        <template #footer>
            <div class="flex flex-row justify-end w-full">
                <el-pagination
                layout="total, sizes, prev, pager, next, jumper"
                :page-sizes="[10, 20, 50, 100, 200, 300]"
                v-model:page-size="pageSize"
                v-model:current-page="currentPage"
                :total="totalEnvironments"
                @size-change="fetchEnvironments"
                @current-change="fetchEnvironments"
                class="flex justify-center"
                />
            </div>
        </template>
    </el-card>

    <!-- Add Dialog -->
    <el-dialog title="Add Environment" v-model="showAddEnvironmentDialog" class="bg-white rounded-md" append-to-body>
        <el-form :model="newEnvironment" label-position="top">
            <el-form-item label="name">
                <el-input v-model="newEnvironment.name" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="showAddEnvironmentDialog = false">Cancel</el-button>
            <el-button type="primary" @click="createEnvironment">Create</el-button>
        </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog title="Edit Environment" v-model="showEditEnvironmentDialog" class="bg-white rounded-md" append-to-body>
        <el-form :model="editingEnvironment" label-position="top">
            <el-form-item label="name">
                <el-input v-model="editingEnvironment.name" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="showEditEnvironmentDialog = false">Cancel</el-button>
            <el-button type="primary" @click="updateEnvironment">Update</el-button>
        </template>
    </el-dialog>

    <!-- Delete Confirmation Dialog -->
    <el-dialog title="Delete Environment" v-model="showDeleteEnvironmentDialog" class="bg-white rounded-md" append-to-body>
        <p>Are you sure you want to delete this environment?</p>
        <template #footer>
            <el-button @click="showDeleteEnvironmentDialog = false">Cancel</el-button>
            <el-button type="danger" @click="deleteEnvironment">Delete</el-button>
        </template>
    </el-dialog>
</template>

<script>
    export default {
        data() {
            return {
                loading: false,
                environments: [],
                totalEnvironments: 0,
                currentPage: 1,
                pageSize: 10,
                showAddEnvironmentDialog: false,
                showEditEnvironmentDialog: false,
                showDeleteEnvironmentDialog: false,
                environmentIdToDelete: null,
                newEnvironment: {
                    name: '',
                },
                editingEnvironment: null,
            };
        },
        mounted() {
            this.fetchEnvironments();
        },
        methods: {
            fetchEnvironments() {
                this.loading = true;
                this.makeRequest('post', 'artillery-service/v1/environment.list')
                .then((response) => {
                    this.environments = response.data.results;
                    this.totalEnvironments = this.environments.length;
                })
                .catch((error) => {
                    console.error('Error fetching environments:', error);
                    this.$message.error('Error fetching environments');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            createEnvironment() {
                this.loading = true;
                this.makeRequest('post', 'artillery-service/v1/environment.create', this.newEnvironment)
                .then(() => {
                    this.showAddEnvironmentDialog = false;
                    this.newEnvironment = {
                        name: '',
                    };
                    this.fetchEnvironments();
                    this.$message.success('Environment created successfully');
                })
                .catch((error) => {
                    console.error('Error creating environment:', error);
                    this.$message.error('Error creating environment');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            editEnvironment(environment) {
                this.editingEnvironment = { ...environment };
                this.showEditEnvironmentDialog = true;
            },
            updateEnvironment() {
                this.loading = true;
                this.makeRequest('post', 'artillery-service/v1/environment.update', this.editingEnvironment)
                .then(() => {
                    this.showEditEnvironmentDialog = false;
                    this.fetchEnvironments();
                    this.$message.success('Environment updated successfully');
                })
                .catch((error) => {
                    console.error('Error updating environment:', error);
                    this.$message.error('Error updating environment');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            confirmDeleteEnvironment(id) {
                this.environmentIdToDelete = id;
                this.showDeleteEnvironmentDialog = true;
            },
            deleteEnvironment() {
                this.loading = true;
                this.makeRequest('post', 'artillery-service/v1/environment.delete', {id: this.environmentIdToDelete})
                .then(() => {
                    this.showDeleteEnvironmentDialog = false;
                    this.fetchEnvironments();
                    this.$message.success('Environment deleted successfully');
                })
                .catch((error) => {
                    console.error('Error deleting environment:', error);
                    this.$message.error('Error deleting environment');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            manage(environment) {
                this.$router.push({ name: 'EnvironmentManagement', params: { envId: environment.id.replace("env:", "") } });
            },
        },
    };
</script> 