<template>
    <el-card class="container mx-auto" body-class="flex flex-col space-y-10">
        <div class="flex justify-between items-center">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/environments' }">Environment</el-breadcrumb-item>
                <el-breadcrumb-item>{{ selectedEnvironment.name }}</el-breadcrumb-item>
                <el-breadcrumb-item>Variables</el-breadcrumb-item>
            </el-breadcrumb>
            <div class="flex flex-row space-x-2">
                <el-button type="info" @click="selectEnvFile">Import .env File</el-button>
                <el-button type="primary" icon="Plus" @click="showAddEnvironmentVarDialog = true">Add Environment Var</el-button>
                <el-button type="danger" icon="Delete" @click="confirmDeleteAll">Delete All</el-button>
                <el-button type="success" icon="Refresh" circle @click="fetchEnvironmentVars()"></el-button>
            </div>
        </div>
        <el-table :data="environmentVars" v-loading="loading" class="w-full" stripe>
            <el-table-column prop="id" label="ID" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="value" label="Value" />
            <el-table-column label="Actions" width="200">
                <template #default="scope">
                    <el-button type="primary" icon="Edit" size="small" @click="editEnvironmentVar(scope.row)">Edit</el-button>
                    <el-button type="danger" icon="Delete" size="small" @click="confirmDeleteEnvironmentVar(scope.row.id)">Delete</el-button>
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
                :total="totalEnvironmentVars"
                @size-change="fetchEnvironmentVars"
                @current-change="fetchEnvironmentVars"
                class="flex justify-center"
                />
            </div>
        </template>
    </el-card>

    <!-- Add Dialog -->
    <el-dialog title="Add Environment Var" v-model="showAddEnvironmentVarDialog" class="bg-white rounded-md" append-to-body>
        <el-form :model="newEnvironmentVar" label-position="top">
            <el-form-item label="Name">
                <el-input v-model="newEnvironmentVar.name" />
            </el-form-item>
            <el-form-item label="Value">
                <el-input v-model="newEnvironmentVar.value" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="showAddEnvironmentVarDialog = false">Cancel</el-button>
            <el-button type="primary" @click="createEnvironmentVar">Create</el-button>
        </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog title="Edit Environment Var" v-model="showEditEnvironmentVarDialog" class="bg-white rounded-md" append-to-body>
        <el-form :model="editingEnvironmentVar" label-position="top">
            <el-form-item label="Name">
                <el-input v-model="editingEnvironmentVar.name" disabled/>
            </el-form-item>
            <el-form-item label="Value">
                <el-input v-model="editingEnvironmentVar.value" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="showEditEnvironmentVarDialog = false">Cancel</el-button>
            <el-button type="primary" @click="updateEnvironmentVar">Update</el-button>
        </template>
    </el-dialog>

    <!-- Delete Confirmation Dialog -->
    <el-dialog title="Delete Environment Var" v-model="showDeleteEnvironmentVarDialog" class="bg-white rounded-md" append-to-body>
        <p>Are you sure you want to delete this environment var?</p>
        <template #footer>
            <el-button @click="showDeleteEnvironmentVarDialog = false">Cancel</el-button>
            <el-button type="danger" @click="deleteEnvironmentVar">Delete</el-button>
        </template>
    </el-dialog>

    <!-- Delete All Confirmation Dialog -->
    <el-dialog title="Delete All Environment Vars" v-model="showDeleteAllDialog" class="bg-white rounded-md" append-to-body>
        <p>Are you sure you want to delete all environment variables?</p>
        <template #footer>
            <el-button @click="showDeleteAllDialog = false">Cancel</el-button>
            <el-button type="danger" @click="deleteAllEnvironmentVars">Delete All</el-button>
        </template>
    </el-dialog>

    <!-- Deleting Progress Dialog -->
    <el-dialog title="Deleting Environment Vars" v-model="showDeletingProgressDialog" class="bg-white rounded-md" append-to-body>
        <p>Deleting {{ deletedCount }} of {{ environmentVars.length }} variables...</p>
        <div class="py-4" v-if="progressPercentage >= 0">
            <el-progress :percentage="progressPercentage"></el-progress>
        </div>
    </el-dialog>
</template>

<script>
    export default {
        data() {
            return {
                loading: false,
                environments: [],
                totalEnvironment: 0,
                environmentVars: [],
                totalEnvironmentVars: 0,
                currentPage: 1,
                pageSize: 10,
                envVarId: null,
                showAddEnvironmentVarDialog: false,
                showEditEnvironmentVarDialog: false,
                showDeleteEnvironmentVarDialog: false,
                showDeleteAllDialog: false,
                showDeletingProgressDialog: false,
                environmentVarIdToDelete: null,
                selectedEnvironment: { name: '' },
                newEnvironmentVar: {
                    name: '',
                    value: '',
                },
                editingEnvironmentVar: null,
                deletedCount: 0,
            };
        },
        computed: {
            progressPercentage() {
                return parseInt((this.deletedCount / this.environmentVars.length) * 100);
            }
        },
        mounted() {
            this.fetchEnvironmentVars();
            this.fetchEnvironment();
        },
        created() {
            this.envId = "env:" + this.$route.params.envId;
        },
        methods: {
            selectEnvFile() {
                const input = document.createElement('input');
                input.type = 'file';
                // input.accept = '.env';
                input.onchange = (event) => {
                    const file = event.target.files[0];
                    if (file && file.name.endsWith('.env')) {
                        this.importEnvFile(file);
                    } else {
                        this.$message.error('Please select a valid .env file.');
                    }
                };
                input.click();
            },
            importEnvFile(file) {
                this.loading = true;
                const formData = new FormData();
                formData.append('environment_id', this.envId);
                formData.append('file', file);

                this.makeRequest('post', 'artillery-service/v1/environment.createVariableFromFile', formData, { 'content-type': 'multipart/form-data' })
                .then(() => {
                    this.$message.success('File imported successfully');
                    this.fetchEnvironmentVars();
                })
                .catch((error) => {
                    console.error('Error importing file:', error);
                    this.$message.error('Error importing file');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            fetchEnvironment() {
                this.loading = true;
                this.makeRequest('post', 'artillery-service/v1/environment.list')
                .then((response) => {
                    this.environments = response.data.results;
                    this.totalEnvironment = this.environments.length;
                    this.selectedEnvironment = this.environments.find(env => env.id === this.envId);
                })
                .catch((error) => {
                    console.error('Error fetching environment vars:', error);
                    this.$message.error('Error fetching environment vars');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            fetchEnvironmentVars() {
                this.loading = true;
                this.makeRequest('post', 'artillery-service/v1/environment.listVariable', { environment_id: this.envId })
                .then((response) => {
                    this.environmentVars = response.data.results;
                    this.totalEnvironmentVars = this.environmentVars.length;
                })
                .catch((error) => {
                    console.error('Error fetching environment vars:', error);
                    this.$message.error('Error fetching environment vars');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            createEnvironmentVar() {
                this.loading = true;
                this.newEnvironmentVar.environment_id = this.envId;
                this.makeRequest('post', 'artillery-service/v1/environment.createVariable', this.newEnvironmentVar)
                .then(() => {
                    this.showAddEnvironmentVarDialog = false;
                    this.newEnvironmentVar = {
                        name: '',
                        value: '',
                    };
                    this.fetchEnvironmentVars();
                    this.$message.success('Environment var created successfully');
                })
                .catch((error) => {
                    console.error('Error creating environment var:', error);
                    this.$message.error('Error creating environment var');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            editEnvironmentVar(envVar) {
                this.editingEnvironmentVar = {
                    environment_id: this.envId,
                    name: envVar.name,
                    variable_id: envVar.id,
                    value: envVar.value,
                };
                this.showEditEnvironmentVarDialog = true;
            },
            updateEnvironmentVar() {
                this.loading = true;
                this.makeRequest('post', 'artillery-service/v1/environment.updateVariable', this.editingEnvironmentVar)
                .then(() => {
                    this.showEditEnvironmentVarDialog = false;
                    this.fetchEnvironmentVars();
                    this.$message.success('Environment var updated successfully');
                })
                .catch((error) => {
                    console.error('Error updating environment var:', error);
                    this.$message.error('Error updating environment var');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            confirmDeleteEnvironmentVar(id) {
                this.environmentVarIdToDelete = { environment_id: this.envId, id: id };
                this.showDeleteEnvironmentVarDialog = true;
            },
            deleteEnvironmentVar() {
                this.loading = true;
                this.makeRequest('post', 'artillery-service/v1/environment.deleteVariable', this.environmentVarIdToDelete)
                .then(() => {
                    this.showDeleteEnvironmentVarDialog = false;
                    this.fetchEnvironmentVars();
                    this.$message.success('Environment var deleted successfully');
                })
                .catch((error) => {
                    console.error('Error deleting environment var:', error);
                    this.$message.error('Error deleting environment var');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            confirmDeleteAll() {
                this.showDeleteAllDialog = true;
            },
            deleteAllEnvironmentVars() {
                this.showDeletingProgressDialog = true;
                this.showDeleteAllDialog = false;
                this.deletedCount = 0;
                const deletePromises = this.environmentVars.map((envVar) => {
                    const data = { environment_id: this.envId, id: envVar.id };
                    return this.makeRequest('post', 'artillery-service/v1/environment.deleteVariable', data)
                    .then(() => {
                        this.deletedCount++;
                    });
                });
                Promise.all(deletePromises)
                .then(() => {
                    this.showDeletingProgressDialog = false;
                    this.fetchEnvironmentVars();
                    this.$message.success('All environment vars deleted successfully');
                })
                .catch((error) => {
                    console.error('Error deleting all environment vars:', error);
                    this.$message.error('Error deleting all environment vars');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
        },
    };
</script>