<template>
    <el-card class="container mx-auto" body-class="flex flex-col space-y-10">
        <div class="flex justify-between items-center">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/launch-templates' }">Launch Templates</el-breadcrumb-item>
            </el-breadcrumb>
            <div class="flex flex-row space-x-2">
                <el-button type="primary" icon="Plus" @click="showAddLaunchTemplateDialog = true">Add Launch Template</el-button>
                <el-button type="success" icon="Refresh" circle @click="fetchLaunchTemplates()"></el-button>
            </div>
        </div>
        <el-table :data="launchTemplates" v-loading="loading" class="w-full" stripe>
            <el-table-column prop="name" label="Name">
                <template #default="scope">
                    <div class="flex flex-col justify-start">
                        <b>{{ scope.row.name }}</b>
                        <p class="text-xs">{{ scope.row.id }}</p>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="version" label="Version" align="center"/>
            <el-table-column label="Plan">
                <template #default="scope">
                    <p>{{ linode_types.filter(plan => plan.id === scope.row.plan_id).length > 0 ? linode_types.find(plan => plan.id === scope.row.plan_id).label : scope.row.plan_id }}</p>
                </template>
            </el-table-column>
            <el-table-column label="Image">
                <template #default="scope">
                    <p>{{ images.filter(image => image.id === scope.row.image_id).length > 0 ? images.find(image => image.id === scope.row.image_id).label : scope.row.image_id }}</p>
                </template>
            </el-table-column>
            <el-table-column label="Region">
                <template #default="scope">
                    <p>{{ regions.filter(region => region.id === scope.row.region_id).length > 0 ? regions.find(region => region.id === scope.row.region_id).label : scope.row.region_id }}</p>
                </template>
            </el-table-column>
            <el-table-column label="Firewall">
                <template #default="scope">
                    <p>{{ firewalls.filter(firewall => firewall.id === scope.row.firewall_id).length > 0 ? firewalls.find(firewall => firewall.id === scope.row.firewall_id).label : scope.row.firewall_id }}</p>
                </template>
            </el-table-column>
            <el-table-column label="Created At">
                <template #default="scope">
                    {{ timeAgo(scope.row.created_at.Time) }}
                </template>
            </el-table-column>
            <el-table-column label="Actions" align="center">
                <template #default="scope">
                    <el-button type="primary" icon="Edit" size="small" @click="editLaunchTemplate(scope.row)"></el-button>
                    <el-button type="danger" icon="Delete" size="small" @click="confirmDeleteLaunchTemplate(scope.row.id)"></el-button>
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
                :total="totalLaunchTemplates"
                @size-change="fetchLaunchTemplates"
                @current-change="fetchLaunchTemplates"
                class="flex justify-center"
                />
            </div>
        </template>
    </el-card>

    <!-- Add Dialog -->
    <el-dialog title="Add Launch Template" v-model="showAddLaunchTemplateDialog" class="bg-white rounded-md" append-to-body>
        <el-form :model="newLaunchTemplate" label-position="top">
            <el-form-item label="Name">
                <el-input v-model="newLaunchTemplate.name" required/>
            </el-form-item>
            <el-form-item label="Instance Password">
                <el-input v-model="newLaunchTemplate.password" placeholder="Password for instance" required>
                    <template #append>
                        <el-icon class="cursor-pointer" @click="generatePassword('new')"><Switch /></el-icon>
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item label="Image Type">
                <el-select v-model="newLaunchTemplate.is_private_image" placeholder="Select Image Type" required>
                    <el-option label="Official" :value="false"></el-option>
                    <el-option label="Private" :value="true"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Image ID">
                <el-select v-if="!newLaunchTemplate.is_private_image" v-model="newLaunchTemplate.image_id" placeholder="Select OS Image" filterable required>
                    <el-option v-for="image in images" :key="image.id" :label="image.label" :value="image.id"></el-option>
                </el-select>
                <el-input v-else v-model="newLaunchTemplate.image_id" placeholder="private/xxxxxxxx"/>
            </el-form-item>
            <el-form-item label="Linode Type">
                <el-select v-model="newLaunchTemplate.plan_id" placeholder="Select Linode" filterable required>
                    <el-option v-for="linode_type in linode_types" :key="linode_type.id" :label="linode_type.label" :value="linode_type.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Environment ID">
                <el-select v-model="newLaunchTemplate.environment_id" placeholder="Select Environment" filterable required>
                    <el-option v-for="env in environments" :key="env.id" :label="env.name" :value="env.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Linode Token ID">
                <el-select v-model="newLaunchTemplate.linode_token_id" placeholder="Select Credential" filterable required>
                    <el-option v-for="cred in credentials" :key="cred.id" :label="cred.name" :value="cred.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Region ID">
                <el-select v-model="newLaunchTemplate.region_id" placeholder="Select Region" filterable>
                    <el-option v-for="region in regions" :key="region.id" :label="region.label+' ('+region.id+')'" :value="region.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Run Script">
                <el-input type="textarea" v-model="newLaunchTemplate.launch_data.run_script" />
            </el-form-item>
            <el-form-item label="Start Command">
                <el-input v-model="newLaunchTemplate.launch_data.start_command" />
            </el-form-item>
            <el-form-item label="Port">
                <el-input v-model="newLaunchTemplate.port" />
            </el-form-item>
            <el-form-item label="Firewall ID">
                <el-select v-model="newLaunchTemplate.firewall_id" placeholder="Select Firewall" v-if="firewalls && firewalls.length > 0" filterable>
                    <el-option v-for="firewall in firewalls" :key="firewall.id" :label="firewall.id + ' - ' +firewall.label" :value="firewall.id"></el-option>
                </el-select>
                <el-input v-model="newLaunchTemplate.firewall_id" v-else/>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="showAddLaunchTemplateDialog = false">Cancel</el-button>
            <el-button type="primary" @click="createLaunchTemplate">Create</el-button>
        </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog title="Edit Launch Template" v-model="showEditLaunchTemplateDialog" class="bg-white rounded-md" append-to-body>
        <el-form :model="editingLaunchTemplate" label-position="top">
            <el-form-item label="Name">
                <el-input v-model="editingLaunchTemplate.name" disabled/>
            </el-form-item>
            <el-form-item label="Version">
                <el-input v-model="editingLaunchTemplate.version" disabled/>
            </el-form-item>
            <el-form-item label="Instance Password">
                <el-input v-model="editingLaunchTemplate.password" placeholder="Password for instance">
                    <template #append>
                        <el-icon class="cursor-pointer" @click="generatePassword('edit')"><Switch /></el-icon>
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item label="Image Type">
                <el-select v-model="editingLaunchTemplate.is_private_image" placeholder="Select Image Type">
                    <el-option label="Official" :value="false"></el-option>
                    <el-option label="Private" :value="true"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Image ID">
                <el-select v-if="!editingLaunchTemplate.is_private_image" v-model="editingLaunchTemplate.image_id" placeholder="Select OS Image" filterable>
                    <el-option v-for="image in images" :key="image.id" :label="image.label" :value="image.id"></el-option>
                </el-select>
                <el-input v-else v-model="editingLaunchTemplate.image_id" placeholder="private/xxxxxxxx"/>
            </el-form-item>
            <el-form-item label="Linode Type">
                <el-select v-model="editingLaunchTemplate.plan_id" placeholder="Select Linode" filterable required>
                    <el-option v-for="linode_type in linode_types" :key="linode_type.id" :label="linode_type.label" :value="linode_type.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Environment ID">
                <el-select v-model="editingLaunchTemplate.environment_id" placeholder="Select Environment" filterable>
                    <el-option v-for="env in environments" :key="env.id" :label="env.name" :value="env.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Linode Token ID">
                <el-select v-model="editingLaunchTemplate.linode_token_id" placeholder="Select Credential" filterable>
                    <el-option v-for="cred in credentials" :key="cred.id" :label="cred.name" :value="cred.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Region ID">
                <el-select v-model="editingLaunchTemplate.region_id" placeholder="Select Region" filterable>
                    <el-option v-for="region in regions" :key="region.id" :label="region.label+' ('+region.id+')'" :value="region.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Run Script">
                <el-input type="textarea" v-model="editingLaunchTemplate.launch_data.run_script" />
            </el-form-item>
            <el-form-item label="Start Command">
                <el-input v-model="editingLaunchTemplate.launch_data.start_command" />
            </el-form-item>
            <el-form-item label="Port">
                <el-input v-model="editingLaunchTemplate.port" />
            </el-form-item>
            <el-form-item label="Firewall ID">
                <el-select v-model="editingLaunchTemplate.firewall_id" placeholder="Select Firewall" v-if="firewalls && firewalls.length > 0" filterable>
                    <el-option v-for="firewall in firewalls" :key="firewall.id" :label="firewall.id + ' - ' +firewall.label" :value="firewall.id"></el-option>
                </el-select>
                <el-input v-model="editingLaunchTemplate.firewall_id" v-else/>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="showEditLaunchTemplateDialog = false">Cancel</el-button>
            <el-button type="primary" @click="updateLaunchTemplate">Update</el-button>
        </template>
    </el-dialog>

    <!-- Delete Confirmation Dialog -->
    <el-dialog title="Delete Launch Template" v-model="showDeleteLaunchTemplateDialog" class="bg-white rounded-md" append-to-body>
        <p>Are you sure you want to delete this launch template?</p>
        <template #footer>
            <el-button @click="showDeleteLaunchTemplateDialog = false">Cancel</el-button>
            <el-button type="danger" @click="deleteLaunchTemplate">Delete</el-button>
        </template>
    </el-dialog>
</template>

<script>
    import axios from 'axios';

    export default {
        data() {
            return {
                loading: false,
                launchTemplates: [],
                totalLaunchTemplates: 0,
                currentPage: 1,
                pageSize: 10,
                showAddLaunchTemplateDialog: false,
                showEditLaunchTemplateDialog: false,
                showDeleteLaunchTemplateDialog: false,
                launchTemplateIdToDelete: null,
                newLaunchTemplate: {
                    name: '',
                    password: '',
                    is_private_image: false,
                    image_id: '',
                    plan_id: '',
                    environment_id: '',
                    linode_token_id: '',
                    region_id: '',
                    launch_method: "run_script",
                    launch_data: {
                        run_script: "",
                        start_command: ""
                    },
                    port: '80',
                    firewall_id: 0,
                },
                editingLaunchTemplate: null,
                environments: [], // Assuming environments data will be fetched
                credentials: [], // Assuming credentials data will be fetched
                regions: [],
                firewalls: [],
                images: [],
                linode_types: [],
            };
        },
        mounted() {
            this.fetchLaunchTemplates();
            this.fetchEnvironments(); // Fetch environments data
            this.fetchCredentials(); // Fetch credentials data
            this.fetchLinodeTypes();
        },
        methods: {
            generatePassword(type) {
                if (type == 'new') {
                    this.newLaunchTemplate.password = this.generateRandomPassword(12);
                    this.newLaunchTemplate.password += "$";
                } else {
                    this.editingLaunchTemplate.password = this.generateRandomPassword(12);
                    this.editingLaunchTemplate.password += "$";
                }
            },
            fetchRegions() {
                this.loading = true;
                axios.get(`https://api.linode.com/v4/regions`)
                .then((response) => {
                    this.regions = response.data.data.filter(region => region.capabilities.includes("Linodes"))
                    .map(region => ({
                        id: region.id,
                        label: region.label,
                        country: region.country
                    }));
                })
                .catch((error) => {
                    console.error('Error fetching regions:', error);
                    this.$message.error('Error fetching regions');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            fetchLinodeTypes() {
                this.loading = true;
                axios.get(`https://api.linode.com/v4/linode/types`)
                .then((response) => {
                    this.linode_types = response.data.data
                    .map(linode_type => ({
                        id: linode_type.id,
                        label: linode_type.label,
                        class: linode_type.class,
                        disk: linode_type.disk,
                        memory: linode_type.memory,
                        price: linode_type.price,
                        vcpus: linode_type.vcpus,
                    }));
                })
                .catch((error) => {
                    this.showErrorMessage(error);
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            fetchImages() {
                this.loading = true;
                axios.get('https://api.linode.com/v4/images?page=1&page_size=100', {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${this.linodeToken}`
                    }
                })
                .then((response) => {
                    this.images = response.data.data.filter(image => image.capabilities.includes("cloud-init"))
                    .map(image => ({
                        id: image.id,
                        label: image.label,
                        vendor: image.vendor,
                        cloudInit: image.capabilities.includes("cloud-init")
                    }));
                })
                .catch((error) => {
                    console.error('Error fetching images:', error);
                    this.$message.error('Error fetching images');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            fetchFirewalls() {
                axios.get('https://api.linode.com/v4/networking/firewalls?page=1&page_size=100', {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${this.linodeToken}`
                    }
                })
                .then((response) => {
                    this.firewalls = response.data.data.map(firewall => ({
                        id: firewall.id,
                        label: firewall.label
                    }));
                })
                .catch((error) => {
                    console.error('Error fetching firewalls:', error);
                    this.$message.error('Error fetching firewalls');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
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
            fetchCredentials() {
                this.loading = true;
                this.makeRequest('post', 'artillery-service/v1/credential.list')
                .then((response) => {
                    this.credentials = response.data.results;
                    this.totalCredentials = this.credentials.length;
                    const linodeToken = this.credentials.find(credential => credential.name === 'LINODE_TOKEN');
                    if (linodeToken) {
                        this.linodeToken = linodeToken.value;
                    }
                })
                .catch((error) => {
                    console.error('Server responded with an error:', error);
                    this.$message.error('Error fetching credentials');
                })
                .finally(() => {
                    this.loading = false;
                    this.fetchFirewalls();
                    this.fetchRegions();
                    this.fetchImages();
                });
            },
            fetchLaunchTemplates() {
                this.loading = true;
                this.makeRequest('post', 'asg-service/v1/launchTemplates.list')
                .then((response) => {
                    this.launchTemplates = Object.values(response.data.results.reduce((acc, item) => (!acc[item.name] || item.version > acc[item.name].version) ? (acc[item.name] = item, acc) : acc, {}));
                    this.totalLaunchTemplates = this.launchTemplates.length;
                })
                .catch((error) => {
                    console.error('Error fetching launch templates:', error);
                    this.$message.error('Error fetching launch templates');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            createLaunchTemplate() {
                this.loading = true;
                this.newLaunchTemplate.launch_data.run_script = btoa(this.newLaunchTemplate.launch_data.run_script);
                this.newLaunchTemplate.launch_data.start_command = btoa(this.newLaunchTemplate.launch_data.start_command);
                this.newLaunchTemplate.is_private_image = this.newLaunchTemplate.image_id.includes('private');
                this.makeRequest('post', 'asg-service/v1/launchTemplates.create', this.newLaunchTemplate)
                .then(() => {
                    this.showAddLaunchTemplateDialog = false;
                    this.newLaunchTemplate = {
                        name: '',
                        password: '',
                        is_private_image: false,
                        image_id: '',
                        plan_id: '',
                        environment_id: '',
                        linode_token_id: '',
                        region_id: '',
                        launch_method: "run_script",
                        launch_data: {
                            run_script: "",
                            start_command: ""
                        },
                        port: '80',
                        firewall_id: 0,
                    };
                    this.fetchLaunchTemplates();
                    this.$message.success('Launch template created successfully');
                })
                .catch((error) => {
                    this.showErrorMessage(error);
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            editLaunchTemplate(launchTemplate) {
                this.makeRequest('post', 'asg-service/v1/launchTemplate.describe', {
                    lt_id: launchTemplate.id,
                    version: launchTemplate.version
                })
                .then((response) => {
                    this.editingLaunchTemplate = {
                        lt_id: response.data.id,
                        name: response.data.name,
                        version: response.data.version,
                        plan_id: response.data.plan_id,
                        password: "",
                        image_id: response.data.image_id,
                        environment_id: response.data.environment_id,
                        linode_token_id: response.data.linode_token_id,
                        region_id: response.data.region_id,
                        port: response.data.port,
                        firewall_id: parseInt(response.data.firewall_id),
                        launch_method: response.data.launch_method,
                        launch_data: {
                            run_script: atob(response.data.launch_data_run_script?.run_script),
                            start_command: atob(response.data.launch_data_run_script?.start_command)
                        }
                    }
                    this.editingLaunchTemplate.is_private_image = this.editingLaunchTemplate.image_id.includes('private');
                    this.showEditLaunchTemplateDialog = true;
                })
                .catch((error) => {
                    this.showErrorMessage(error);
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            updateLaunchTemplate() {
                this.loading = true;
                let launchTemplateRevision = JSON.parse(JSON.stringify(this.editingLaunchTemplate));
                launchTemplateRevision.version = parseInt(this.editingLaunchTemplate.version) + 1;
                launchTemplateRevision.launch_data.run_script = btoa(this.editingLaunchTemplate.launch_data.run_script);
                launchTemplateRevision.launch_data.start_command = btoa(this.editingLaunchTemplate.launch_data.start_command);
                launchTemplateRevision.is_private_image = this.editingLaunchTemplate.image_id.includes('private');
                launchTemplateRevision.firewall_id = parseInt(launchTemplateRevision.firewall_id);
                this.makeRequest('post', 'asg-service/v1/launchTemplate.update', launchTemplateRevision)
                .then(() => {
                    this.showEditLaunchTemplateDialog = false;
                    this.fetchLaunchTemplates();
                    this.$message.success('Launch template updated successfully');
                })
                .catch((error) => {
                    this.showErrorMessage(error);
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            confirmDeleteLaunchTemplate(id) {
                this.launchTemplateIdToDelete = id;
                this.showDeleteLaunchTemplateDialog = true;
            },
            deleteLaunchTemplate() {
                this.loading = true;
                this.makeRequest('post', 'asg-service/v1/launchTemplate.delete', {id: this.launchTemplateIdToDelete})
                .then(() => {
                    this.showDeleteLaunchTemplateDialog = false;
                    this.fetchLaunchTemplates();
                    this.$message.success('Launch template deleted successfully');
                })
                .catch((error) => {
                    this.showErrorMessage(error);
                })
                .finally(() => {
                    this.loading = false;
                });
            },
        },
    };
</script>