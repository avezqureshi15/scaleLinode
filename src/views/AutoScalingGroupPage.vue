<template>
  <el-card class="container mx-auto" body-class="flex flex-col space-y-10">
    <div class="flex justify-between items-center">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/auto-scaling-groups' }"
          >Auto Scaling Groups</el-breadcrumb-item
        >
      </el-breadcrumb>
      <div class="flex flex-row space-x-2">
        <el-button type="primary" icon="Plus" @click="showAddAutoScalingGroupDialog = true"
          >Add Auto Scaling Group</el-button
        >
        <el-button
          type="success"
          icon="Refresh"
          circle
          @click="fetchAutoScalingGroups()"
        ></el-button>
      </div>
    </div>
    <el-table :data="autoScalingGroups" v-loading="loading" class="w-full" stripe>
      <el-table-column prop="name" label="Name">
        <template #default="scope">
          <div class="flex flex-col justify-start">
            <b>{{ scope.row.name }}</b>
            <p class="text-xs">{{ scope.row.id }}</p>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="state" label="State" align="center" width="100">
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.state == 'RUNNING'">{{ scope.row.state }}</el-tag>
          <el-tag type="warning" v-else-if="scope.row.state == 'REFRESHING'">{{
            scope.row.state
          }}</el-tag>
          <el-tag type="danger" v-else-if="scope.row.state == 'IN_ROLLBACK'">{{
            scope.row.state
          }}</el-tag>
          <el-tag type="info" v-else>{{ scope.row.state }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Launch Template" align="center" width="320">
        <template #default="scope">
          <el-descriptions size="small" :column="1" border>
            <el-descriptions-item
              align="right"
              :label="
                launchTemplates.filter((launchTemplates) => launchTemplates.id === scope.row.lt_id)
                  .length > 0
                  ? launchTemplates.find(
                      (launchTemplates) => launchTemplates.id === scope.row.lt_id
                    ).name
                  : scope.row.lt_id
              "
              ><b>v</b>{{ scope.row.lt_version }}</el-descriptions-item
            >
            <el-descriptions-item align="right" label="Network Threshold">{{
              scope.row.network_threshold
            }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <el-table-column label="Network" align="center" width="250">
        <template #default="scope">
          <el-descriptions size="small" :column="1" border>
            <el-descriptions-item align="right" label="VPC">{{
              vpcs.filter((vpc) => vpc.id === scope.row.vpc_id).length > 0
                ? vpcs.find((vpc) => vpc.id === scope.row.vpc_id).label
                : scope.row.vpc_id
            }}</el-descriptions-item>
            <el-descriptions-item align="right" label="Subnet">{{
              vpcs.filter((vpc) => vpc.id === scope.row.vpc_id).length > 0
                ? vpcs
                    .find((vpc) => vpc.id === scope.row.vpc_id)
                    .subnets.find((subnet) => subnet.id === scope.row.subnet_id).label
                : scope.row.subnet_id
            }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <el-table-column label="Time" align="center" width="250">
        <template #default="scope">
          <el-descriptions size="small" :column="1" border>
            <el-descriptions-item align="right" label="Last Refresh">{{
              timeAgo(scope.row.last_refresh_completed_at.Time)
            }}</el-descriptions-item>
            <el-descriptions-item align="right" label="Created">{{
              timeAgo(scope.row.created_at.Time)
            }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="200" align="center" fixed="right">
        <template #default="scope">
          <el-button type="info" icon="Setting" size="small" @click="manage(scope.row)"></el-button>
          <el-button
            type="primary"
            icon="Edit"
            size="small"
            @click="editAutoScalingGroup(scope.row)"
          ></el-button>
          <el-button
            type="danger"
            icon="Delete"
            size="small"
            @click="confirmDeleteAutoScalingGroup(scope.row)"
          ></el-button>
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
          :total="totalAutoScalingGroups"
          @size-change="fetchAutoScalingGroups"
          @current-change="fetchAutoScalingGroups"
          class="flex justify-center"
        />
      </div>
    </template>
  </el-card>

  <!-- Add Dialog -->
  <el-dialog
    title="Add Auto Scaling Group"
    v-model="showAddAutoScalingGroupDialog"
    class="bg-white rounded-md"
    append-to-body
  >
    <el-form :model="newAutoScalingGroup" label-position="top">
      <el-form-item label="Name">
        <el-input v-model="newAutoScalingGroup.name" />
      </el-form-item>
      <el-form-item label="Launch Template ID">
        <el-select
          v-model="newAutoScalingGroup.launch_template_id"
          placeholder="Select Launch Template"
          @change="filterLaunchTemplateVersions('new')"
        >
          <el-option
            v-for="lt in launchTemplates"
            :key="lt.id"
            :label="lt.name"
            :value="lt.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Launch Template Version">
        <el-select
          v-model="newAutoScalingGroup.launch_template_version"
          placeholder="Select Launch Template Version"
        >
          <el-option
            v-for="lt in filteredNewLaunchTemplates"
            :key="lt.version"
            :label="lt.version"
            :value="lt.version"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="VPC ID">
        <el-select
          v-model="newAutoScalingGroup.vpc_id"
          placeholder="Select VPC"
          v-if="filteredVpcs.length"
        >
          <el-option
            v-for="vpc in filteredVpcs"
            :key="vpc.id"
            :label="vpc.label"
            :value="vpc.id"
          ></el-option>
        </el-select>
        <el-input v-else v-model="newAutoScalingGroup.vpc_id" placeholder="Enter VPC ID"></el-input>
      </el-form-item>
      <el-form-item label="Subnet ID" v-if="newAutoScalingGroup.vpc_id">
        <el-select v-model="newAutoScalingGroup.subnet_id" placeholder="Select Subnet">
          <el-option
            v-for="subnet in filteredSubnets"
            :key="subnet.id"
            :label="subnet.label + ' (' + subnet.ipv4 + ')'"
            :value="subnet.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-switch
          v-model="newAutoScalingGroup.use_https"
          active-text="Use SSL"
          @change="toggleSSL"
        >
        </el-switch>
      </el-form-item>
      <el-form-item label="SSL Certificate" v-if="newAutoScalingGroup.use_https">
        <el-select
          v-model="newAutoScalingGroup.ssl_certificate_cred_id"
          placeholder="Select SSL Certificate"
        >
          <el-option
            v-for="cred in credentials"
            :key="cred.id"
            :label="cred.name"
            :value="cred.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Private Key" v-if="newAutoScalingGroup.use_https">
        <el-select
          v-model="newAutoScalingGroup.private_key_cred_id"
          placeholder="Select Private Key"
        >
          <el-option
            v-for="cred in credentials"
            :key="cred.id"
            :label="cred.name"
            :value="cred.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <div class="grid grid-cols-2">
        <el-form-item label="Min Instance Capacity">
          <el-input-number v-model="newAutoScalingGroup.min_desired_capacity" :min="1" />
        </el-form-item>
        <el-form-item label="Max Instance Capacity">
          <el-input-number
            v-model="newAutoScalingGroup.max_desired_capacity"
            :min="newAutoScalingGroup.min_desired_capacity + 1"
          />
        </el-form-item>
        <el-form-item label="CPU Threshold (%)">
          <el-input-number v-model="newAutoScalingGroup.cpu_threshold" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="Memory Threshold (%)">
          <el-input-number v-model="newAutoScalingGroup.memory_threshold" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="Control Loop Period (seconds)">
          <el-input-number
            v-model="newAutoScalingGroup.control_loop_period"
            :min="30"
            :max="3600"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="Network Threshold (bytes)">
          <el-input-number
            v-model="newAutoScalingGroup.network_threshold"
            :min="1"
            :max="9999999999"
          />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="showAddAutoScalingGroupDialog = false">Cancel</el-button>
      <el-button type="primary" @click="showAddAsgDialog = true">Create</el-button>
    </template>
  </el-dialog>

  <el-dialog
    title="Confirmation"
    v-model="showAddAsgDialog"
    class="bg-white rounded-md"
    append-to-body
  >
    <el-checkbox v-model="addConfirmed">I confirm that the details are correct?</el-checkbox>
    <template #footer>
      <el-button @click="showAddAsgDialog = false">Cancel</el-button>
      <el-button type="success" :disabled="!addConfirmed" @click="createAutoScalingGroup"
        >Create</el-button
      >
    </template>
  </el-dialog>

  <!-- Edit Dialog -->
  <el-dialog
    title="Edit Auto Scaling Group"
    v-model="showEditAutoScalingGroupDialog"
    class="bg-white rounded-md"
    append-to-body
  >
    <el-form :model="editingAutoScalingGroup" label-position="top">
      <el-form-item label="Name">
        <el-input v-model="editingAutoScalingGroup.name" disabled />
      </el-form-item>
      <el-form-item label="Launch Template ID">
        <el-select
          v-model="editingAutoScalingGroup.launch_template_id"
          placeholder="Select Launch Template"
          @change="filterLaunchTemplateVersions('edit')"
          disabled
        >
          <el-option
            v-for="lt in launchTemplates"
            :key="lt.id"
            :label="lt.name"
            :value="lt.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Launch Template Version">
        <el-select
          v-model="editingAutoScalingGroup.launch_template_version"
          placeholder="Select Launch Template Version"
        >
          <el-option
            v-for="lt in filteredEditLaunchTemplates"
            :key="lt.version"
            :label="lt.version"
            :value="lt.version"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="VPC ID">
        <el-select
          v-model="editingAutoScalingGroup.vpc_id"
          placeholder="Select VPC"
          v-if="filteredVpcs.length"
        >
          <el-option
            v-for="vpc in filteredVpcs"
            :key="vpc.id"
            :label="vpc.label"
            :value="vpc.id"
          ></el-option>
        </el-select>
        <el-input
          v-else
          v-model="editingAutoScalingGroup.vpc_id"
          placeholder="Enter VPC ID"
        ></el-input>
      </el-form-item>
      <el-form-item label="Subnet ID" v-if="editingAutoScalingGroup.vpc_id">
        <el-select v-model="editingAutoScalingGroup.subnet_id" placeholder="Select Subnet">
          <el-option
            v-for="subnet in filteredSubnets"
            :key="subnet.id"
            :label="subnet.label + ' (' + subnet.ipv4 + ')'"
            :value="subnet.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-switch
          v-model="editingAutoScalingGroup.use_https"
          active-text="Use SSL"
          @change="toggleSSL"
        >
        </el-switch>
      </el-form-item>
      <el-form-item label="SSL Certificate" v-if="editingAutoScalingGroup.use_https">
        <el-select
          v-model="editingAutoScalingGroup.ssl_certificate_cred_id"
          placeholder="Select SSL Certificate"
        >
          <el-option
            v-for="cred in credentials"
            :key="cred.id"
            :label="cred.name"
            :value="cred.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Private Key" v-if="editingAutoScalingGroup.use_https">
        <el-select
          v-model="editingAutoScalingGroup.private_key_cred_id"
          placeholder="Select Private Key"
        >
          <el-option
            v-for="cred in credentials"
            :key="cred.id"
            :label="cred.name"
            :value="cred.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <div class="grid grid-cols-2">
        <el-form-item label="Min Instance Capacity">
          <el-input-number
            v-model="editingAutoScalingGroup.min_desired_capacity"
            :min="1"
            :max="100"
          />
        </el-form-item>
        <el-form-item label="Max Instance Capacity">
          <el-input-number
            v-model="editingAutoScalingGroup.max_desired_capacity"
            :min="editingAutoScalingGroup.min_desired_capacity + 1"
            :max="100"
          />
        </el-form-item>
        <el-form-item label="CPU Threshold (%)">
          <el-input-number v-model="editingAutoScalingGroup.cpu_threshold" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="Memory Threshold (%)">
          <el-input-number v-model="editingAutoScalingGroup.memory_threshold" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="Control Loop Period (seconds)">
          <el-input-number
            v-model="editingAutoScalingGroup.control_loop_period"
            :min="30"
            :max="3600"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="Network Threshold (bytes)">
          <el-input-number
            v-model="editingAutoScalingGroup.network_threshold"
            :min="1"
            :max="9999999999"
          />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="showEditAutoScalingGroupDialog = false">Cancel</el-button>
      <el-button type="primary" @click="showUpdateAsgDialog = true">Update</el-button>
    </template>
  </el-dialog>

  <el-dialog
    title="Confirmation"
    v-model="showUpdateAsgDialog"
    class="bg-white rounded-md"
    append-to-body
  >
    <el-checkbox v-model="addConfirmed">I confirm that the details are correct?</el-checkbox>
    <template #footer>
      <el-button @click="showUpdateAsgDialog = false">Cancel</el-button>
      <el-button type="success" :disabled="!addConfirmed" @click="updateAutoScalingGroup"
        >Update</el-button
      >
    </template>
  </el-dialog>

  <!-- Delete Confirmation Dialog -->
  <el-dialog
    title="Delete Auto Scaling Group"
    v-model="showDeleteAutoScalingGroupDialog"
    class="bg-white rounded-md"
    append-to-body
  >
    <p>Are you sure you want to delete this auto scaling group?</p>
    <template #footer>
      <el-button @click="showDeleteAutoScalingGroupDialog = false">Cancel</el-button>
      <el-button type="danger" @click="deleteAutoScalingGroup">Delete</el-button>
    </template>
  </el-dialog>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      showAddAutoScalingGroupDialog: false,
      showAddAsgDialog: false,
      showUpdateAsgDialog: false,
      addConfirmed: false,
      updateConfirmed: false,
      loading: false,
      autoScalingGroups: [],
      totalAutoScalingGroups: 0,
      currentPage: 1,
      pageSize: 10,
      showAddAutoScalingGroupDialog: false,
      showEditAutoScalingGroupDialog: false,
      showDeleteAutoScalingGroupDialog: false,
      autoScalingGroupToDelete: null,
      newAutoScalingGroup: {
        name: '',
        launch_template_id: '',
        launch_template_version: '',
        vpc_id: '',
        subnet_id: '',
        min_desired_capacity: 1,
        max_desired_capacity: 1,
        cpu_threshold: '80',
        memory_threshold: '90',
        use_https: false,
        control_loop_period: 30,
        network_threshold: 31457280,
        ssl_certificate_cred_id: null,
        private_key_cred_id: null
      },
      editingAutoScalingGroup: null,
      launchTemplates: [], // Assuming launch templates data will be fetched
      filteredNewLaunchTemplates: [],
      filteredEditLaunchTemplates: [],
      launchTemplates: [],
      vpcs: [],
      subnets: [],
      filteredVpcs: [], // New data property for filtered VPCs
      filteredSubnets: [] // New data property for filtered subnets
    }
  },
  mounted() {
    this.fetchAutoScalingGroups()
    this.fetchLaunchTemplates()
    this.fetchLaunchTemplates() // Fetch launch templates data
    this.fetchCredentials() // Fetch credentials data
  },
  watch: {
    'newAutoScalingGroup.vpc_id': 'onVPCChange',
    'editingAutoScalingGroup.vpc_id': 'onEditVPCChange'
  },
  methods: {
    confirmDeleteAutoScalingGroup() {
      this.showAddAsgDialog = true // Open the confirmation dialog
      this.showUpdateAsgDialog = true // Open the confirmation dialog
      this.addConfirmed = false
      this.updateConfirmed = false
      // Reset confirmation checkbox
    },
    toggleSSL(val) {
      this.newAutoScalingGroup.use_https = val
      if (!val || !this.newAutoScalingGroup.use_https) {
        this.newAutoScalingGroup.ssl_certificate_cred_id = null
        this.newAutoScalingGroup.private_key_cred_id = null
      }
    },
    fetchLaunchTemplates() {
      this.loading = true
      this.makeRequest('post', 'asg-service/v1/launchTemplates.list')
        .then((response) => {
          this.launchTemplates = Object.values(
            response.data.results.reduce(
              (acc, item) =>
                !acc[item.name] || item.version > acc[item.name].version
                  ? ((acc[item.name] = item), acc)
                  : acc,
              {}
            )
          )
          this.totalLaunchTemplates = this.launchTemplates.length
        })
        .catch((error) => {
          console.error('Error fetching launch templates:', error)
          this.$message.error('Error fetching launch templates')
        })
        .finally(() => {
          this.loading = false
        })
    },
    filterLaunchTemplateVersions(type) {
      if (type === 'new') {
        this.filteredNewLaunchTemplates = this.launchTemplates.filter(
          (lt) => lt.id === this.newAutoScalingGroup.launch_template_id
        )
        this.newAutoScalingGroup.launch_template_version = ''
        if (this.filteredNewLaunchTemplates.length === 1) {
          this.newAutoScalingGroup.launch_template_version =
            this.filteredNewLaunchTemplates[0].version
        }
        this.filterVpcsByRegion()
      } else if (type === 'edit') {
        this.filteredEditLaunchTemplates = this.launchTemplates.filter(
          (lt) => lt.id === this.editingAutoScalingGroup.launch_template_id
        )
        this.editingAutoScalingGroup.launch_template_version = ''
        if (this.filteredEditLaunchTemplates.length === 1) {
          this.editingAutoScalingGroup.launch_template_version =
            this.filteredEditLaunchTemplates[0].version
        }
        this.filterVpcsByRegion()
      }
    },
    filterVpcsByRegion() {
      const selectedLaunchTemplate = this.launchTemplates.find(
        (lt) => lt.id === this.newAutoScalingGroup.launch_template_id
      )
      if (false) {
        this.filteredVpcs = this.vpcs.filter(
          (vpc) => vpc.region === selectedLaunchTemplate.region_id
        )
      } else {
        this.filteredVpcs = this.vpcs
      }
    },
    fetchSubnetsByVPC(vpc_id) {
      // Assuming subnets are part of the VPC data structure.
      const selectedVPC = this.vpcs.find((vpc) => vpc.id === vpc_id)
      this.filteredSubnets = selectedVPC ? selectedVPC.subnets : []
    },
    onVPCChange() {
      if (this.newAutoScalingGroup.vpc_id) {
        this.fetchSubnetsByVPC(this.newAutoScalingGroup.vpc_id)
      }
    },
    onEditVPCChange() {
      if (this.editingAutoScalingGroup.vpc_id) {
        this.fetchSubnetsByVPC(this.editingAutoScalingGroup.vpc_id)
      }
    },
    fetchVpcs() {
      this.loading = true
      axios
        .get('https://api.linode.com/v4/vpcs', {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.linodeToken}`
          }
        })
        .then((response) => {
          this.vpcs = response.data.data.map((vpc) => ({
            id: vpc.id,
            label: vpc.label,
            region: vpc.region,
            subnets: vpc.subnets
          }))
          this.filterVpcsByRegion()
        })
        .catch((error) => {
          console.error('Error fetching VPCs:', error)
          this.$message.error('Error fetching VPCs')
        })
        .finally(() => {
          this.loading = false
        })
    },
    fetchCredentials() {
      this.loading = true
      this.makeRequest('post', 'artillery-service/v1/credential.list')
        .then((response) => {
          this.credentials = response.data.results
          this.totalCredentials = this.credentials.length
          const linodeToken = this.credentials.find(
            (credential) => credential.name === 'LINODE_TOKEN'
          )
          if (linodeToken) {
            this.linodeToken = linodeToken.value
          }
        })
        .catch((error) => {
          console.error('Server responded with an error:', error)
          this.$message.error('Error fetching credentials')
        })
        .finally(() => {
          this.loading = false
          this.fetchVpcs()
        })
    },
    fetchLaunchTemplates() {
      this.loading = true
      this.makeRequest('post', 'asg-service/v1/launchTemplates.list')
        .then((response) => {
          this.launchTemplates = Object.values(
            response.data.results.reduce(
              (acc, item) =>
                !acc[item.name] || item.version > acc[item.name].version
                  ? ((acc[item.name] = item), acc)
                  : acc,
              {}
            )
          )
          this.totalLaunchTemplates = this.launchTemplates.length
        })
        .catch((error) => {
          console.error('Error fetching launch templates:', error)
          this.$message.error('Error fetching launch templates')
        })
        .finally(() => {
          this.loading = false
        })
    },
    fetchAutoScalingGroups() {
      this.loading = true
      this.makeRequest('post', 'asg-service/v1/asg.list')
        .then((response) => {
          this.autoScalingGroups = response.data.results
          this.totalAutoScalingGroups = this.autoScalingGroups.length
        })
        .catch((error) => {
          console.error('Error fetching auto scaling groups:', error)
          this.$message.error('Error fetching auto scaling groups')
        })
        .finally(() => {
          this.loading = false
        })
    },
    createAutoScalingGroup() {
      this.showAddAsgDialog = false
      this.loading = true
      this.makeRequest('post', 'asg-service/v1/asg.create', this.newAutoScalingGroup)
        .then(() => {
          this.showAddAutoScalingGroupDialog = false
          this.newAutoScalingGroup = {
            name: '',
            launch_template_id: '',
            launch_template_version: '',
            min_desired_capacity: 1,
            max_desired_capacity: 1,
            cpu_threshold: '80',
            memory_threshold: '90',
            use_https: false,
            control_loop_period: 30,
            network_threshold: 31457280,
            ssl_certificate_cred_id: null,
            private_key_cred_id: null
          }
          this.fetchAutoScalingGroups()
          this.$message.success('Auto scaling group created successfully')
        })
        .catch((error) => {
          console.error('Error creating auto scaling group:', error)
          this.$message.error('Error creating auto scaling group')
        })
        .finally(() => {
          this.loading = false
        })
    },
    editAutoScalingGroup(autoScalingGroup) {
      this.loading = true
      this.makeRequest('post', 'asg-service/v1/asg.describe', { asg_id: autoScalingGroup.id })
        .then((response) => {
          this.editingAutoScalingGroup = {
            asg_id: response.data.id,
            name: response.data.name,
            launch_template_id: response.data.lt_id,
            launch_template_version: response.data.lt_version,
            min_desired_capacity: response.data.min_desired_capacity,
            max_desired_capacity: response.data.max_desired_capacity,
            cpu_threshold: response.data.cpu_threshold,
            memory_threshold: response.data.memory_threshold,
            nodebalancer_ip: response.data.nodebalancer_ip,
            webhook_url: response.data.webhook_url,
            created_at: response.data.created_at,
            use_https: response.data?.use_https,
            control_loop_period: response.data.control_loop_period || 30,
            network_threshold: response.data.network_threshold || 31457280,
            ssl_certificate_cred_id: '',
            private_key_cred_id: ''
          }
          if (response.data.vpc_id) {
            this.editingAutoScalingGroup.vpc_id = response.data.vpc_id
          }
          if (response.data.subnet_id) {
            this.editingAutoScalingGroup.subnet_id = response.data.subnet_id
          }
          if (response.data.ssl_certificate_cred_id) {
            this.editingAutoScalingGroup.ssl_certificate_cred_id =
              response.data.ssl_certificate_cred_id
          }
          if (response.data.private_key_cred_id) {
            this.editingAutoScalingGroup.private_key_cred_id = response.data.private_key_cred_id
          }
          this.filterLaunchTemplateVersions('edit')
          this.showEditAutoScalingGroupDialog = true
        })
        .catch((error) => {
          console.error('Server responded with an error:', error.response.data)
          this.$message.error('Error fetching auto scaling group: Server responded with an error')
        })
        .finally(() => {
          this.loading = false
        })
    },
    updateAutoScalingGroup() {
      this.loading = true
      this.showUpdateAsgDialog = false
      this.makeRequest('post', 'asg-service/v1/asg.update', this.editingAutoScalingGroup)
        .then(() => {
          this.showEditAutoScalingGroupDialog = false
          this.fetchAutoScalingGroups()
          this.$message.success('Auto scaling group updated successfully')
        })
        .catch((error) => {
          console.error('Error updating auto scaling group:', error)
          this.$message.error('Error updating auto scaling group')
        })
        .finally(() => {
          this.loading = false
        })
    },
    confirmDeleteAutoScalingGroup(asg) {
      this.autoScalingGroupToDelete = { asg_id: asg.id, asg_name: asg.name }
      this.showDeleteAutoScalingGroupDialog = true
    },
    deleteAutoScalingGroup() {
      this.loading = true
      this.makeRequest('post', 'asg-service/v1/asg.delete', this.autoScalingGroupToDelete)
        .then(() => {
          this.showDeleteAutoScalingGroupDialog = false
          this.fetchAutoScalingGroups()
          this.$message.success('Auto scaling group deleted successfully')
        })
        .catch((error) => {
          console.error('Error deleting auto scaling group:', error)
          this.$message.error('Error deleting auto scaling group')
        })
        .finally(() => {
          this.loading = false
        })
    },
    manage(asg) {
      this.$router.push({
        name: 'AutoScalingGroupManagement',
        params: { asgId: asg.id.replace('asg:', '') }
      })
    }
  }
}
</script>
